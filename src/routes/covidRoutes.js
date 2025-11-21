// src/routes/covidRoutes.js
console.log("covidRoutes loaded");
import express from 'express'
import axios from 'axios'

const router = express.Router()

router.get('/covid', async (req, res) => {
  try {
    const response = await axios.get('https://data.covid19india.org/data.json')
    const totalData = response.data.statewise.find(s => s.state === 'Total')
    const activeCases = parseInt(totalData.active)
    res.json({ activeCases })
  } catch (err) {
    console.error(err)
    res.status(500).json({ activeCases: 0 })
  }
})

export default router
