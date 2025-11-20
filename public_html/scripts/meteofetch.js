// Configuration de l'api Météo-Concept
// exemple d'utilisation : 
// https://api.meteo-concept.com/api/ephemeride/0?token=<votre clé d'api meteo-concept ici>
let meteo = {
    /**
     * Clé de stockage des données en sessionStorage (stockage éphémère navigateur)
     * @type String
     */
    STORAGE_DATA_KEY: "meteoData",
    /**
     * Clé de stockage des données de la ville en sessionStorage (stockage éphémère navigateur)
     * @type String
     */
    STORAGE_CITY_KEY: "meteoCity",
    /**
     * Clé de stockage du timestamp de dernier appel en sessionStorage (stockage éphémère navigateur)
     * @type String
     */
    STORAGE_TIMESTAMP_KEY: "meteoTimestamp",
    /**
     * Token pour l'api meteo-concept
     * @type String 
     */
    API_KEY: "",
    /**
     * Url de l'api
     * @type String
     */
    API_URL: "https://api.meteo-concept.com/api",
    /**
     * Choix d'usage Mock ou api réelle pour économie du quota d'appels
     *  - Passer à true pour utiliser le mock
     *  - Passer à false pour api réelle Météo-Concept
     * @type Boolean
     */
    USE_MOCK: false,
    /**
     * Choix d'usage le timestamp pour forcer les appels pendant le développement
     *  - Passer à true pour utiliser le timestamp
     *  - Passer à false pour forcer le raffraîchissement des appels
     * @type Boolean
     */
    USE_TIMESTAMP: true,
    /**
     * Fonction pour vérifier si les données en cache sont valides
     * @returns {Number|Boolean}
     */
    isCacheValid: function () {
        const timestamp = sessionStorage.getItem(this.STORAGE_TIMESTAMP_KEY);
        if (!timestamp) return false; // Pas de données en cache

        const lastFetchTime = new Date(timestamp);
        const now = new Date();
        const oneHour = 60 * 60 * 1000; // 1 heure en millisecondes

        return (now - lastFetchTime) < oneHour;
    },
    /**
     * Fonction pour sauvegarder les données et le timestamp
     * @param {type} data
     * @param {type} key
     * @returns {undefined}
     */
    saveToCache: function (data, key) {
        sessionStorage.setItem(key, JSON.stringify(data));
        if(key !== this.STORAGE_CITY_KEY) {
            sessionStorage.setItem(this.STORAGE_TIMESTAMP_KEY, new Date().toISOString());
        }
    },
    /**
     * Fonction pour récupérer les données depuis le cache
     * @returns {Object|null}
     */
    getFromCache: function () {
        const city = sessionStorage.getItem(this.STORAGE_CITY_KEY);
        const data = sessionStorage.getItem(this.STORAGE_DATA_KEY);
        if(!city || !data)
            return null;
        
        return {city: JSON.parse(city), data: JSON.parse(data)};
    },
    /**
     * 
     * @type Object
     */
    config: {
        city: null,
        inseeCode: null
    },
    /**
     * Charge la configuration
     * @returns {Promise}
     */
    fetchConfig: function () {
        return fetch('/config/configuration.json')
                .then(response => response.json())
                .then(cfg => {
                    this.config.city = cfg.ville;
                    if (!this.USE_MOCK && (!cfg.API_KEY || cfg.API_KEY.length < 35)) {
                        throw new Error("Clé d'api obligatoire !.");
                    }
                    this.API_KEY = cfg.API_KEY;
                    // Si le code INSEE n'est pas fourni ou invalide, on le cherche via l'API
                    if (!cfg.code_insee || isNaN(cfg.code_insee)) {
                        return this.fetchCity(cfg.ville)
                                .then(response => {
                                    if (response.cities && response.cities.length > 0) {
                                        this.config.inseeCode = response.cities[0].insee;
                                    } else {
                                        throw new Error("Aucune ville trouvée avec ce nom.");
                                    }
                                });
                    } else {
                        this.config.inseeCode = cfg.code_insee;
                    }
                });
    },
    /**
     * Charge la météo
     * 
     * @returns {Promise}
     */
    fetchMeteo: function () {
        return this.fetchConfig().then(() => {
            const cachedData = this.getFromCache();
            if (this.USE_MOCK) {
                return fetch(`/config/mock-meteo.json`)
                        .then(response => response.json());
            } else if (cachedData && this.isCacheValid() && this.USE_TIMESTAMP) {
                this.config.inseeCode = cachedData.city.insee;
                return Promise.resolve(cachedData.data);
            } else {
                if (!this.config.inseeCode || isNaN(this.config.inseeCode)) {
                    throw new Error("Code INSEE invalide ou manquant");
                }
                return fetch(`${this.API_URL}/forecast/daily?token=${this.API_KEY}&insee=${this.config.inseeCode}&start=0&end=0`)
                        .then(response => {
                            if (!response.ok) {
                                throw new Error(`Erreur API : ${response.status}`);
                            }
                        return response.json();
                    })
                    .then(data => {
                        this.saveToCache(data, this.STORAGE_DATA_KEY);
                        return data;
                    });
            }
        });
    },
    /**
     * Charge la ville depuis l'api
     *  https://api.meteo-concept.com/api/location/cities?search=Saint%20Maxire&token=
     * @param {string} city
     * @returns {Promise}
     */
    fetchCity: function (city) {
        const cachedData = this.getFromCache();
        if (this.USE_MOCK) {
            return fetch(`/config/mock-cities.json`)
                    .then(response => response.json());
        } else if (cachedData && this.isCacheValid() && this.USE_TIMESTAMP) {
            this.config.inseeCode = cachedData.city.insee;
            return Promise.resolve(cachedData.city);
        } else {
            if (!city || city.length <= 1) {
                throw new Error("Nom de ville invalide ou manquant");
            }
            this.config.city = city;
            const encodedCity = encodeURI(this.config.city);
            return fetch(`${this.API_URL}/location/cities?search=${encodedCity}&token=${this.API_KEY}`)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`Erreur API : ${response.status}`);
                        }
                            return response.json();
                        })
                        .then(data => {
                            this.saveToCache(data, this.STORAGE_CITY_KEY);
                            return data;
                        });
        }
    },
    /**
     * Icône de temps selon le code
     * @param {integer} weatherCode
     * @returns {String|weatherIcons|meteo.getWeatherIconClass.weatherIcons}
     */
    getWeatherIconClass: function (weatherCode) {
        const weatherIcons = {
            0: "fa-sun",                  // Soleil
            1: "fa-cloud-sun",            // Peu nuageux
            2: "fa-cloud-sun",            // Ciel voilé
            3: "fa-cloud-sun",            // Nuageux
            4: "fa-cloud",                // Très nuageux
            5: "fa-cloud",                // Couvert
            6: "fa-smog",                 // Brume
            7: "fa-smog",                 // Brouillard
            10: "fa-cloud-rain",          // Pluie faible
            11: "fa-cloud-rain",          // Pluie modérée
            12: "fa-cloud-showers-heavy", // Pluie forte
            13: "fa-cloud-showers-water", // Pluie très forte
            14: "fa-cloud-rain",          // Averses
            15: "fa-bolt",                // Orage
            16: "fa-snowflake",           // Neige faible
            17: "fa-snowflake",           // Neige modérée
            18: "fa-snowflake"            // Neige forte
        };

        return weatherIcons[weatherCode] || "fa-question";
    },
    /**
     * Description du temps selon le code
     * @param {integer} weatherCode
     * @returns {weatherIcons|meteo.getWeathertext.weatherIcons|String}
     */
    getWeathertext: function (weatherCode) {
        const weatherIcons = {
            0: "Ensoleillé",
            1: "Peu nuageux",
            2: "Ciel voilé",
            3: "Nuageux",
            4: "Très nuageux",
            5: "Couvert",
            6: "Brume",
            7: "Brouillard",
            10: "Pluie faible",
            11: "Pluie modérée",
            12: "Pluie forte",
            13: "Pluie très forte",
            14: "Averses",
            15: "Orage",
            16: "Neige faible",
            17: "Neige modérée",
            18: "Neige forte"
        };

        return weatherIcons[weatherCode] || "fa-question";
    },
    /**
     * Couleurs des icones en fonction du temps
     * @param {integer} weatherCode
     * @returns {meteo.getWeatherIconColor.meteofetchAnonym$0}
     */
    getWeatherIconColor: function (weatherCode) {
        // Couleurs RGAA-compliant (contraste ≥ 3:1)
        const weatherColors = {
            0: "#FFD700",  // Soleil (jaune)
            1: "#FFD700",  // Peu nuageux (jaune)
            2: "#FFD700",  // Ciel voilé (jaune)
            3: "#FFFFFF",  // Nuageux (blanc)
            4: "#FFFFFF",  // Très nuageux (noir)
            5: "#FFFFFF",  // Couvert (noir)
            6: "#696969",  // Brume (gris foncé)
            7: "#696969",  // Brouillard (gris foncé)
            10: "#0000FF", // Pluie faible (bleu vif)
            11: "#00008B", // Pluie modérée (bleu foncé)
            12: "#00008B", // Pluie forte (bleu foncé)
            13: "#00008B", // Pluie très forte (bleu foncé)
            14: "#0000FF", // Averses (bleu vif)
            15: "#FF0000", // Orage (rouge)
            16: "#4682B4", // Neige faible (bleu acier)
            17: "#4682B4", // Neige modérée (bleu acier)
            18: "#4682B4"  // Neige forte (bleu acier)
        };

        // Ombre adaptée pour chaque couleur
        const weatherShadows = {
            0: "3px 3px 6px rgba(0, 0, 0, 0.5)", // Ombre pour le soleil
            10: "3px 3px 6px rgba(255, 255, 255, 0.7)", // Ombre blanche pour la pluie
            15: "3px 3px 6px rgba(0, 0, 0, 0.5)", // Ombre pour l'orage
            16: "2px 2px 4px rgba(0, 0, 0, 0.5)"  // Ombre pour la neige
        };

        return {
            color: weatherColors[weatherCode] || "#000000", // Noir par défaut
            shadow: weatherShadows[weatherCode] || "3px 3px 6px rgba(0, 0, 0, 0.7)"
        };
    },
    /**
     * Peuple la page en fonction du retour api
     * @param {Object} data
     * @returns {meteo.setWeather}
     */
    setWeather: function (data) {
        const {weather, tmax, tmin} = data.forecast[0];
        const {name, latitude, longitude, altitude, cp} = data.city;

        const iconClass = this.getWeatherIconClass(weather);
        const {color: iconColor, shadow: iconShadow} = this.getWeatherIconColor(weather);
        const weatherText = this.getWeathertext(weather);
        const $iconElement = document.querySelector(".weather-icon-full i");
        const $temperatureElement = document.querySelector(".temperature");
        const $weatherFeelElement = document.querySelector(".wheather-feel");
        const $localisationElement = document.querySelector(".localisation");
        const $footerElement = document.querySelector("main.card footer");

        $iconElement.className = `fas ${iconClass}`;
        $iconElement.style.color = iconColor;
        $iconElement.style.filter = `drop-shadow(${iconShadow})`;
        $temperatureElement.innerHTML = `${tmax}°C`;
        $weatherFeelElement.innerHTML = weatherText;
        $localisationElement.querySelector(".city").innerHTML = name;
        $localisationElement.querySelector(".postal-code").innerHTML = cp;
        $footerElement.querySelector(".temperature-minimal p.temp").innerHTML = `${tmin}°C`;
        $footerElement.querySelector(".altitude p").innerHTML = `${altitude}M`;
        $footerElement.querySelector(".lat-lon p").innerHTML = `${latitude},${longitude}`;
    }
};

function fetchAndUpdate() {
    meteo.fetchMeteo()
            .then(data => {
                meteo.setWeather(data);
                console.log("Données météo :", data);
            })
            .catch(error => console.error("Erreur :", error));
}

setInterval(fetchAndUpdate, 60 * 1000);

fetchAndUpdate();

