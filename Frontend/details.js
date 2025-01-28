document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const movieId = urlParams.get("id");

    if (!movieId) {
        alert("Nenhum ID de filme fornecido!");
        return;
    }

    try {
        const response = await fetch(`http://localhost:5500/get_film_by_id/${movieId}`);
        const movieData = await response.json();

        if (response.ok && movieData) {
            const movie = movieData;

            const filmDetails = document.getElementById("film-details");

            const posterImage = movie.image !== "Imagem não encontrada" && movie.image !== "N/A" 
                ? movie.image 
                : "https://via.placeholder.com/200";

            const trailerId = movie.trailer && movie.trailer.includes("youtube.com")
                ? movie.trailer.split("v=")[1]
                : null;

            const background = movie.background && movie.background !== "Background não encontrado"
                ? `url("${movie.background}")`
                : "url('https://via.placeholder.com/1280x720?text=Background+não+disponível')";

            document.body.style.backgroundImage = background;

            filmDetails.innerHTML = `
                <div class="container">
                    <div class="banner">
                        <img src="${posterImage}" alt="${movie.title}" class="banner-image">
                    </div>
                    <div class="description">
                        <h1 class="title">${movie.title}</h1>
                        <div class="datetime">
                            <span class="date">${movie.release_date || "Data não disponível."}</span>
                        </div>
                        <div class="progress-circle">
                            <div class="circle">
                                <span class="progress-text">${movie.vote_average ? Math.round(movie.vote_average * 10) + "%" : "N/A"}</span>
                            </div>
                        </div>
                        <h3 class="subtitle">Sinopse</h3>
                        <p class="synopsis">${movie.plot || "Sinopse não disponível."}</p>
                        <div class="trailer-button">
                            <i class="fa-solid fa-play"></i>
                            <button>Ver Trailer</button>
                        </div>
                    </div>
                </div>
            `;

            const trailerButton = document.querySelector('.trailer-button');
            const modal = document.getElementById('modal');
            const modalContent = modal.querySelector('.modal-content');

            // Evento para abrir o modal e carregar o iframe
            trailerButton.onclick = function () {
                if (trailerId) {
                    modalContent.innerHTML = `
                        <span class="close">&times;</span>
                        <iframe src="https://www.youtube.com/embed/${trailerId}" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                    `;
                    modal.style.display = 'flex';
                } else {
                    alert('Trailer não disponível.');
                }
            };

            // Evento para fechar o modal
            modal.onclick = function (event) {
                if (event.target === modal || event.target.classList.contains('close')) {
                    modal.style.display = 'none';
                    modalContent.innerHTML = '<span class="close">&times;</span>';
                }
            };

            const progressCircle = document.querySelector('.progress-circle');
            if (progressCircle) {
                progressCircle.style.background = getConicGradient(movie.vote_average);
            }
        } else {
            alert("Filme não encontrado.");
        }
    } catch (error) {
        console.error("Erro no frontend:", error);
        alert("Erro ao buscar os detalhes do filme! Tente novamente mais tarde.");
    }

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
});
