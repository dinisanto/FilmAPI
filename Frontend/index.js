function searchFilm() {
    const title = document.getElementById("movie-title").value;
    if (title) {
        window.location.href = `results.html?title=${encodeURIComponent(title)}`;
    } else {
        alert("Por favor, insira o título de um filme!");
    }
}