require('dotenv').config();

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const supabase = require('./config/supabaseClient.js');

const app = express();
app.use(cors());
app.use(express.json());

const TMDB_ACCESS_TOKEN = "3e77b0edc4a3f1ba70dba05d0c1423ab";
const OMDB_API_KEY = "3adb50b9";

app.use((req, res, next) => {
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || null;
    req.clientIp = clientIp;
    next();
});

function formatDate(dateString) {
    if (!dateString || dateString === "N/A") return null;
    const date = new Date(dateString);
    if (isNaN(date)) return null;
    return date.toISOString().split('T')[0];
}

async function getTmdbTrailer(movieId) {
    const tmdbTrailerUrl = `https://api.themoviedb.org/3/movie/${movieId}/videos`;
    try {
        const response = await axios.get(tmdbTrailerUrl, {
            params: {
                api_key: TMDB_ACCESS_TOKEN,
                language: "pt-BR",
            },
            headers: {
                "Content-Type": "application/json",
            },
        });

        const videos = response.data.results;
        if (videos && videos.length > 0) {
            const trailer = videos.find(video => video.type === "Trailer");
            if (trailer) {
                return `https://www.youtube.com/watch?v=${trailer.key}`;
            }

            const otherVideo = videos.find(video => video.type === "Teaser" || video.type === "Clip");
            if (otherVideo) {
                return `https://www.youtube.com/watch?v=${otherVideo.key}`;
            }
        }
        return "Trailer não disponível";
    } catch (error) {
        console.error("Erro ao buscar trailer na TMDb API:", error.response ? error.response.data : error.message);
        return "Erro ao buscar trailer";
    }
}

// Rota para buscar filmes por título
app.get('/get_film/:title', async (req, res) => {
    const { title } = req.params;
    const { exact } = req.query;

    try {
        const tmdbSearchUrl = `https://api.themoviedb.org/3/search/movie`;

        const tmdbResponse = await axios.get(tmdbSearchUrl, {
            params: {
                query: title,
                api_key: TMDB_ACCESS_TOKEN,
                language: "pt-BR",
            },
            headers: {
                "Content-Type": "application/json;charset=utf-8",
            },
        });

        const tmdbData = tmdbResponse.data;

        if (!tmdbData.results || tmdbData.results.length === 0) {
            return res.status(404).json({ error: "Nenhum filme encontrado na TMDb." });
        }

        let movies = tmdbData.results;
        if (exact === "true") {
            movies = movies.filter(movie => movie.title.toLowerCase() === title.toLowerCase());
            if (movies.length === 0) {
                return res.status(404).json({ error: "Filme exato não encontrado na TMDb." });
            }
        }

        const enrichedMovies = await Promise.all(
            movies.map(async (movie) => {
                const id_filme = movie.id; // Alteração para id_filme

                const omdbUrl = `http://www.omdbapi.com/?apikey=${OMDB_API_KEY}&t=${encodeURIComponent(movie.title)}`;
                const omdbResponse = await axios.get(omdbUrl);
                const omdbData = omdbResponse.data;

                const release_date = formatDate(omdbData.Released) || formatDate(movie.release_date);
                const vote_average = omdbData.imdbRating && !isNaN(omdbData.imdbRating) ? parseFloat(omdbData.imdbRating) : movie.vote_average;

                const poster = movie.poster_path
                    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                    : (omdbData.Response !== "False" && omdbData.Poster !== "N/A") ? omdbData.Poster : "Imagem não encontrada";

                const background = movie.backdrop_path
                    ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`
                    : "Background não encontrado";

                const trailerUrl = await getTmdbTrailer(id_filme);

                return {
                    id_filme, // Adicionando id_filme
                    title: movie.title,
                    plot: movie.overview || "Sinopse não disponível.",
                    trailer: trailerUrl,
                    image: poster,
                    background: background,
                    release_date: release_date,
                    vote_average: vote_average,
                };
            })
        );

        const clientIp = req.clientIp;
        const dataToInsert = enrichedMovies.map(movie => ({
            ...movie,
            client_ip: clientIp,
        }));

        const { error } = await supabase
            .from('filmes')
            .upsert(dataToInsert, { onConflict: 'id_filme' }); // Usando id_filme como chave única

        if (error) {
            console.error('Erro ao salvar no Supabase:', error.message);
            return res.status(500).json({ error: "Erro ao salvar dados no Supabase" });
        }

        return res.json({
            movies: enrichedMovies,
            message: `${enrichedMovies.length} filme(s) encontrado(s).`,
        });
    } catch (error) {
        console.error("Erro ao buscar dados:", error.message);
        return res.status(500).json({ error: "Erro ao buscar dados das APIs." });
    }
});

// Rota para buscar filmes por ID
app.get('/get_film_by_id/:id_filme', async (req, res) => {
    const { id_filme } = req.params;

    try {
        const tmdbDetailsUrl = `https://api.themoviedb.org/3/movie/${id_filme}`;

        const tmdbResponse = await axios.get(tmdbDetailsUrl, {
            params: {
                api_key: TMDB_ACCESS_TOKEN,
                language: "pt-BR",
            },
            headers: {
                "Content-Type": "application/json;charset=utf-8",
            },
        });

        const movie = tmdbResponse.data;

        const omdbUrl = `http://www.omdbapi.com/?apikey=${OMDB_API_KEY}&t=${encodeURIComponent(movie.title)}`;
        const omdbResponse = await axios.get(omdbUrl);
        const omdbData = omdbResponse.data;

        const release_date = formatDate(omdbData.Released) || formatDate(movie.release_date);
        const vote_average = omdbData.imdbRating && !isNaN(omdbData.imdbRating) ? parseFloat(omdbData.imdbRating) : movie.vote_average;

        const poster = movie.poster_path
            ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
            : (omdbData.Response !== "False" && omdbData.Poster !== "N/A") ? omdbData.Poster : "Imagem não encontrada";

        const background = movie.backdrop_path
            ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`
            : "Background não encontrado";

        const trailerUrl = await getTmdbTrailer(id_filme);

        const enrichedMovie = {
            id_filme, // Adicionando id_filme
            title: movie.title,
            plot: movie.overview || "Sinopse não disponível.",
            trailer: trailerUrl,
            image: poster,
            background: background,
            release_date: release_date,
            vote_average: vote_average,
        };

        const { error } = await supabase
            .from('filmes')
            .upsert({ ...enrichedMovie, client_ip: req.clientIp }, { onConflict: 'id_filme' }); // Usando id_filme como chave única

        if (error) {
            console.error('Erro ao salvar no Supabase:', error.message);
            return res.status(500).json({ error: "Erro ao salvar dados no Supabase" });
        }

        return res.json(enrichedMovie);
    } catch (error) {
        console.error("Erro ao buscar dados por ID:", error.message);
        return res.status(500).json({ error: "Erro ao buscar dados do filme por ID." });
    }
});

const PORT = 5500;
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});