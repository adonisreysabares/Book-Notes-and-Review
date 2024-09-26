import express from 'express'
import dotenv from 'dotenv'
import pool from './database/db.js'
import axios from 'axios'
dotenv.config()

const app = express()
const port = process.env.PORT

app.use(express.urlencoded({ extended:true }))
app.use(express.static('public'))

let books = []

async function fetchData(){
    const dataBooks = await pool.query(`SELECT books.id AS id, books.books_title AS title, books.summary AS summary, books.book_cover AS cover_id, ratings.rating AS rating
         FROM books
         JOIN ratings
         ON books.id = ratings.id
        `)
    const rowData = dataBooks.rows

    return rowData
}

app.get('/', async(req,res)=>{
    const dataBooks =  await fetchData() 
    res.render('index.ejs', {
        title: "Book Notes and Review",
        bookData: dataBooks, 
    })
})

app.post('/postData', (req,res)=>{
    res.render('postData.ejs',{})
})

app.post('/add', async (req, res) => {
    const { title, summary, rating } = req.body
    const queryInsert = `INSERT INTO books(books_title, summary, book_cover, rating_id) VALUES ($1, $2, $3, $4)`
    const queryRatings = 'INSERT INTO ratings(rating) VALUES ($1) RETURNING id' // Changed RETURN id to RETURNING id
    const ratingsValue = [rating]

    try {

        const ratingsResult = await pool.query(queryRatings, ratingsValue)
        const ratingId = ratingsResult.rows[0].id 

        if (ratingId != null) {

            const response = await axios.get(`https://openlibrary.org/search.json?title=${encodeURIComponent(title)}`)
            const booksCover = response.data.docs[0]?.cover_i || null 

            const queryValues = [title, summary, booksCover, ratingId] 

            await pool.query(queryInsert, queryValues)
            console.log('Insert Data Successfully')
            res.status(201).redirect('/') 
        }else{
            console.log('Failed to get rating id')
            res.status(400).redirect('/')
        }


    } catch (error) {
        console.error("An error occurred ", error.stack)
        res.status(500).send('An error occurred while adding the book') 
    }
})


app.post('/update', async (req, res) => {
    const { id, title, summary } = req.body;
    const queryUpdate = `
        UPDATE books
        SET books_title = $1, summary = $2
        WHERE id = $3
    `;
    const queryValues = [title, summary, parseInt(id)];

    try {
        const updateData = await pool.query(queryUpdate, queryValues);
        if (updateData.rowCount > 0) { 
            console.log('Update Data Successfully');
            res.status(200).redirect('/');
        } else {
            console.log('Failed to update data: No rows affected');
            res.status(400).redirect('/');
        }
    } catch (error) {
        console.error('Error updating data:', error);
        res.status(500).send('Internal Server Error'); 
    }
});

app.post('/delete', async(req,res)=>{
    const id = req.body.id

    const queryDelete = `DELETE FROM books WHERE books.id = $1`
    const deletevalue = [id]
    try {
        const resultDelete = await pool.query(queryDelete,deletevalue)

        if(resultDelete.rows <= 0){
            console.log(`Sucessfully Delete the data`)
            res.status(200).redirect('/')
        }
        else{
            console.log(`Failed to delete the data`)
            res.status(400).redirect('/')
        }
    } catch (error) {
        
    }
})


app.listen(port , ()=>{
    console.log(`Server is Listening at http://localhost:${port}`)
})