document.addEventListener("DOMContentLoaded", async () => {
    const filters = {
        genre: [],
        startDate: null,
        endDate: null,
        minDuration: null,
        maxDuration: null,
        ageRating: [],
    };

    const urlParams = new URLSearchParams(window.location.search);
    const title = urlParams.get("title");

    if (!title) {
        alert("Nenhum título de filme fornecido!");
        return;
    }

    const fetchMovies = async () => {
        try {
            const response = await fetch(`http://localhost:5500/get_film/${title}`);
            const data = await response.json();

            if (response.ok) {
                renderMovies(data.movies);
            } else {
                alert(data.error || "Erro ao buscar os filmes.");
            }
        } catch (error) {
            console.error("Erro no frontend:", error);
            alert("Erro ao buscar os filmes. Tente novamente mais tarde.");
        }
    };

    const renderMovies = (movies) => {
        const moviesContainer = document.getElementById("movies-container");
        moviesContainer.innerHTML = "";

        updateProgressCircles(movies.slice(0, 10));

        if (movies.length > 10) {
            const loadMoreButton = document.createElement("button");
            loadMoreButton.textContent = "Ver Mais";
            loadMoreButton.className = "load-more-button";

            let currentCount = 10;

            loadMoreButton.addEventListener("click", () => {
                const nextCount = currentCount + 10;
                updateProgressCircles(movies.slice(currentCount, nextCount));
                currentCount = nextCount;

                if (currentCount >= movies.length) {
                    loadMoreButton.remove();
                }
            });

            moviesContainer.appendChild(loadMoreButton);
        }

        document.getElementById("apply-filters-btn").addEventListener("click", () => {
            updateFiltersAndSorting(movies);
        });

        document.getElementById("sort-by").addEventListener("change", () => {
            updateFiltersAndSorting(movies);
        });
    };

    const updateFiltersAndSorting = (movies) => {
        const movieElements = Array.from(document.querySelectorAll("#movies-container .movie"));

        movieElements.forEach(movie => {
            const genres = movie.getAttribute("data-genre").toLowerCase().split(", ");
            const releaseDate = new Date(movie.getAttribute("data-release-date"));
            const duration = parseInt(movie.getAttribute("data-duration"));
            const ageRating = parseInt(movie.getAttribute("data-age-rating"));

            const matchesGenre = filters.genre.length === 0 || filters.genre.some(g => genres.includes(g));
            const matchesDate =
                (!filters.startDate || releaseDate >= filters.startDate) &&
                (!filters.endDate || releaseDate <= filters.endDate);
            const matchesDuration =
                (!filters.minDuration || duration >= filters.minDuration) &&
                (!filters.maxDuration || duration <= filters.maxDuration);
            const matchesAge = filters.ageRating.length === 0 || filters.ageRating.includes(ageRating);

            movie.style.display = matchesGenre && matchesDate && matchesDuration && matchesAge ? "block" : "none";
        });

        applySorting(movieElements);
    };

    document.getElementById('apply-filters-btn').addEventListener('click', function () {
        const sortOption = document.getElementById('sort-by').value; 

        sortMovies(sortOption);
    });

    function sortMovies(option) {
        const moviesContainer = document.getElementById('movies-container');
        const movies = Array.from(moviesContainer.getElementsByClassName('movie'));

        let sortedMovies;

        switch (option) {
            case 'release-asc':
                sortedMovies = movies.sort((a, b) => {
                    return new Date(a.dataset.releaseDate) - new Date(b.dataset.releaseDate); // ordena por data de lançamento ascendente
                });
            break;
            case 'release-desc':
                sortedMovies = movies.sort((a, b) => {
                    return new Date(b.dataset.releaseDate) - new Date(a.dataset.releaseDate); // ordena por data de lançamento descendente
                });
            break;
            case 'rating-asc':
                sortedMovies = movies.sort((a, b) => {
                    return parseFloat(a.dataset.rating) - parseFloat(b.dataset.rating); // ordena por classificação ascendente
                });
            break;
            case 'rating-desc':
                sortedMovies = movies.sort((a, b) => {
                    return parseFloat(b.dataset.rating) - parseFloat(a.dataset.rating); // ordena por classificação descendente
                });
            break;
            case 'title-asc':
                sortedMovies = movies.sort((a, b) => {
                    return a.querySelector('h3').innerText.localeCompare(b.querySelector('h3').innerText); // ordena por título A-Z
                });
            break;
            case 'title-desc':
                sortedMovies = movies.sort((a, b) => {
                    return b.querySelector('h3').innerText.localeCompare(a.querySelector('h3').innerText); // ordena por título Z-A
                });
            break;
            default:
                sortedMovies = movies;
            }

        moviesContainer.innerHTML = '';

        sortedMovies.forEach(movie => {
            moviesContainer.appendChild(movie);
        });
    }

    const updateProgressCircles = (movies) => {
        const moviesContainer = document.getElementById("movies-container");
        movies.forEach(movie => {
            const movieElement = document.createElement("div");
            movieElement.className = "movie";
    
            const voteAverage = parseFloat(movie.vote_average) || 0;
            const votePercentage = movie.vote_average 
                ? Math.round(movie.vote_average * 10) + "%" 
                : "N/A";
    
            const voteColor =
                voteAverage <= 3.9
                    ? "#ff0000"
                    : voteAverage <= 7
                    ? "#ffcc00"
                    : "#21d07a";
    
            const progressCircleHTML = `        
                <div class="movie-image-container">
                    <img src="${movie.image !== "N/A" ? movie.image : 'https://via.placeholder.com/200'}" alt="${movie.title}" />
                    <div class="progress-circle" style="background: conic-gradient(
                        ${voteColor} 0% ${voteAverage * 10}%,
                      #204529 ${voteAverage * 10}% 100%
                    );">
                        <div class="circle">
                            <span class="progress-text">${votePercentage}</span>
                        </div>
                    </div>
                </div>
                <h3>${movie.title}</h3>
                <p><strong>Data de lançamento:</strong> ${movie.release_date || "N/A"}</p>
            `;
    
            movieElement.innerHTML = progressCircleHTML;

            movieElement.setAttribute("data-genre", movie.genre || "");
            movieElement.setAttribute("data-release-date", movie.release_date || "");
            movieElement.setAttribute("data-duration", movie.duration || "");
            movieElement.setAttribute("data-age-rating", movie.age_rating || "");
            movieElement.setAttribute("data-title", movie.title || "");
            movieElement.setAttribute("data-rating", movie.vote_average || 0);

            movieElement.addEventListener("click", () => {
                const movieTitle = encodeURIComponent(movie.title);
                window.location.href = `/FilmAPI/Frontend/details.html?title=${movieTitle}`;
            });
    
            moviesContainer.appendChild(movieElement);
        });
    };
    

    await fetchMovies();
});