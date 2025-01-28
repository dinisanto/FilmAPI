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
    };

    const updateFiltersAndSorting = (movies) => {
        let sortedMovies = applyFilters(movies);

        // Pegar o valor da opção de ordenação
        const sortBy = document.getElementById("sort-by").value;

        switch (sortBy) {
            case "release-asc":
                sortedMovies = sortedMovies.sort((a, b) => new Date(a.release_date) - new Date(b.release_date));
                break;
            case "release-desc":
                sortedMovies = sortedMovies.sort((a, b) => new Date(b.release_date) - new Date(a.release_date));
                break;
            case "rating-asc":
                sortedMovies = sortedMovies.sort((a, b) => a.vote_average - b.vote_average);
                break;
            case "rating-desc":
                sortedMovies = sortedMovies.sort((a, b) => b.vote_average - a.vote_average);
                break;
            case "title-asc":
                sortedMovies = sortedMovies.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case "title-desc":
                sortedMovies = sortedMovies.sort((a, b) => b.title.localeCompare(a.title));
                break;
            default:
                break;
        }

        renderMovies(sortedMovies);
    };

    const applyFilters = (movies) => {
        // Adicione lógica para aplicar os filtros
        return movies;
    };

    const formatDate = (releaseDate) => {
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        const date = new Date(releaseDate);
        
        // Obter o dia, mês e ano
        const day = date.toLocaleDateString('pt-BR', { day: 'numeric' });
        const month = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
        const year = date.toLocaleDateString('pt-BR', { year: 'numeric' });

        return `${day} de ${month} de ${year}`;
    };

    const updateProgressCircles = (movies) => {
        const moviesContainer = document.getElementById("movies-container");
        movies.forEach(movie => {
            const movieElement = document.createElement("div");
            movieElement.className = "movie";

            const voteAverage = parseFloat(movie.vote_average) || 0;
            const votePercentage = movie.vote_average 
                ? Math.round(movie.vote_average * 10) + "%" 
                : "N/A";

            // Usando a função getConicGradient para definir o gradiente
            const progressCircleGradient = getConicGradient(voteAverage);

            // Formatar a data de lançamento
            const formattedReleaseDate = formatDate(movie.release_date);

            const progressCircleHTML = `        
            <div class="movie-image-container">
                <img src="${movie.image !== "N/A" ? movie.image : 'https://via.placeholder.com/180x273'}" alt="${movie.title}" />
                <div class="progress-circle" style="background: ${progressCircleGradient};">
                    <div class="circle">
                        <span class="progress-text">${votePercentage}</span>
                    </div>
                </div>
            </div>
            <div class="movie-details">
                <h4>${movie.title}</h4>
                <p>${formattedReleaseDate}</p>
            </div>
            `;

            movieElement.innerHTML = progressCircleHTML;
      
            movieElement.setAttribute("data-id-filme", movie.id_filme);
        
            movieElement.addEventListener("click", () => {
                const movieId = movieElement.getAttribute("data-id-filme");
                window.location.href = `/Frontend/details.html?id=${movieId}`;
            });
        
            moviesContainer.appendChild(movieElement);
        });
    };

    // Função para definir o gradiente dinâmico com base na nota
    function getConicGradient(voteAverage) {
        if (!voteAverage) return 'conic-gradient(#666666 0% 0%, #666666 0% 100%)'; // Cor padrão para "N/A"
        const percentage = voteAverage * 10; // Converte para porcentagem (0-100)

        if (percentage <= 39) {
            return `conic-gradient(#db2360 0% ${percentage}%, #571435 ${percentage}% 100%)`; // Vermelho
        } else if (percentage <= 69) {
            return `conic-gradient(#d2d531 0% ${percentage}%, #423d0f ${percentage}% 100%)`; // Amarelo
        } else {
            return `conic-gradient(#21d07a 0% ${percentage}%, #204529 ${percentage}% 100%)`; // Verde
        }
    }

    await fetchMovies();
});