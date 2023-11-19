const express = require('express');
const axios = require('axios');
const qs = require('querystring');
const Excel = require('exceljs');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;

async function getAccessToken() {
    const tokenUrl = 'https://accounts.spotify.com/api/token';
    const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64'),
    };
    const data = {
        grant_type: 'client_credentials'
    };

    try {
        const response = await axios.post(tokenUrl, qs.stringify(data), { headers });
        return response.data.access_token;
    } catch (error) {
        console.error('Error fetching access token', error);
        return null;
    }
}

async function fetchHipHopArtists(accessToken) {
    const searchUrl = 'https://api.spotify.com/v1/search';
    const params = {
        q: 'genre:hip-hop',
        type: 'artist',
        limit: 50,
    };

    try {
        const response = await axios.get(searchUrl, {
            headers: { 'Authorization': `Bearer ${accessToken}` },
            params
        });
        return response.data.artists.items;
    } catch (error) {
        console.error("Error fetching hip hop artists", error);
        return [];
    }
}

async function exportToExcel(artists) {
    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet('Hip Hop Artists');

    worksheet.columns = [
        { header: 'Artist Name', key: 'name', width: 30 },
        { header: 'Popularity', key: 'popularity', width: 15 },
        { header: 'Followers', key: 'followers', width: 15 },
        { header: 'Genre', key: 'genre', width: 30 },
    ];

    artists.forEach(artist => {
        worksheet.addRow({
            name: artist.name,
            popularity: artist.popularity,
            followers: artist.followers.total,
            genre: artist.genres.join(', ')
        });
    });

    try {
        await workbook.xlsx.writeFile('HipHopArtistsForGregV0.xlsx');
        console.log('Excel file created successfully!');
    } catch (error) {
        console.error("Error writing Excel file", error);
    }
}

app.get('/export-artists', async (req, res) => {
    const accessToken = await getAccessToken();
    if (!accessToken) {
        return res.status(500).send('Error retrieving access token');
    }

    const artists = await fetchHipHopArtists(accessToken);
    if (artists.length === 0) {
        return res.status(500).send('No artists data found');
    }

    await exportToExcel(artists);
    res.send('Artists exported to Excel successfully');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
