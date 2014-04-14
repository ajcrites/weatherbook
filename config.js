module.exports = {
    "development": {
        "db": {
            "user": "root",
            "password": "",
            "database": "Weatherbook"
        },
        "weather": {
            "api-key": "35c925a2f69b395c"
        }
    },
    "production": {
        "db": {
            "user": process.env.DB_USER,
            "password": process.env.DB_PASS,
            "host": process.env.DB_HOST,
            "database": process.env.DB_NAME
        },
        "weather": {
            "api-key": "35c925a2f69b395c"
        }
    }
}
