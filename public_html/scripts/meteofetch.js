// Configuration de l'api Météo-Concept
// exemple d'utilisation : 
// https://api.meteo-concept.com/api/ephemeride/0?token=3fc0453afcadfd73ed956c3f7e468e603c4bbdbcafaa83e56a6a746f984cfed1
let meteo = {
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
        return this.fetchConfig().then(
                () => {
            if (this.USE_MOCK) {
                return fetch(`/config/mock-meteo.json`)
                        .then(response => response.json());
            } else {
                if (!this.config.inseeCode || isNaN(this.config.inseeCode)) {
                    throw new Error("Code INSEE invalide ou manquant");
                }
                return fetch(`${this.API_URL}/forecast/daily?token=${this.API_KEY}&insee=${this.config.inseeCode}`)
                        .then(response => {
                            if (!response.ok) {
                                throw new Error(`Erreur API : ${response.status}`);
                            }
                            return response.json();
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
        if (this.USE_MOCK) {
            return fetch(`/config/mock-cities.json`)
                    .then(response => response.json());
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
                    });
        }
    }
};

meteo.fetchMeteo()
        .then(data => console.log("Données météo :", data))
        .catch(error => console.error("Erreur :", error)
        );