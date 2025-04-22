export const authConfig = {
    // JWT configuration
    jwt: {
        accessTokenSecret: process.env["JWT_SECRET_ACCESS_TOKEN"],
        accessTokenExpiry: process.env["JWT_ACCESS_TOKEN_EXPIRY"],

        refreshTokenSecret: process.env["JWT_SECRET_REFRESH_TOKEN"],
        refreshTokenExpiry: process.env["JWT_REFRESH_TOKEN_EXPIRY"],

        passwordResetTokenSecret: process.env["JWT_SECRET_PASSWORD_RESET_TOKEN"],
        passwordResetTokenExpiry: process.env["JWT_PASSWORD_RESET_TOKEN_EXPIRY"]
    },

    // OAuth configuration
    oauth: {
        google: {
            clientID: process.env["GOOGLE_OAUTH_CLIENT_ID"],
            clientSecret: process.env["GOOGLE_OAUTH_CLIENT_ID_SECRET"],
            callbackURL: "/api/v1/auth/google/callback"
        }
    }
};