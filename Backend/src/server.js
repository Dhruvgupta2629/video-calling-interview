import express from 'express';
import path from 'path';
import { ENV } from './lib/env.js';
const app = express();

const __dirname = path.resolve();
app.get('/', (req, res) => {
    res.status(200).json({ message: 'Hello, World!' });
});
app.get('/books', (req, res) => {
    res.status(200).json({ books: ['Book 1', 'Book 2', 'Book 3'] });
});

// make our app ready for deployment
if(ENV.NODE_ENV === 'production'){
    app.use(express.static(path.join(__dirname,"../frontend/dist")));

    app.get('/{*any}',(req,res)=>{
        res.sendFile(path.join(__dirname,"../frontend","dist","index.html"));
    });
}

export { app };

if(ENV.NODE_ENV !== 'test'){
    app.listen(ENV.PORT,()=>{

        console.log(`Server is running on port ${ENV.PORT}`)
    });
}
