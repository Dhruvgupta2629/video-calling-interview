import dotenv from 'dotenv';

dotenv.config();
export const ENV={
    PORT: process.env.PORT,
    DB_URI: process.env.DB_URI
}