const SpotifyAPI = (function () {
  const ClientID = "Taken away for privacy";
  const ClientSecretID = "Taken away for privacy";

  const GetToken = async () => {
    const result = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + btoa(ClientID + ":" + ClientSecretID),
      },
      body: "grant_type=client_credentials",
    });

    const data = await result.json();
    return data.access_token;
  };

  const GetGen = async (token) => {
    const result = await fetch(
      `https://api.spotify.com/v1/browse/categories?locale=sv_US`,
      {
        method: "GET",
        headers: { Authorization: "Bearer " + token },
      }
    );

    const data = await result.json();
    return data.categories.items;
  };

  const GetPlaylist = async (token, genreId) => {
    const limit = 10;

    const result = await fetch(
      `https://api.spotify.com/v1/browse/categories/${genreId}/playlists?limit=${limit}`,
      {
        method: "GET",
        headers: { Authorization: "Bearer " + token },
      }
    );

    const data = await result.json();
    return data.playlists.items;
  };

  const GetSongs = async (token, tracksEndPoint) => {
    const limit = 10;

    const result = await fetch(`${tracksEndPoint}?limit=${limit}`, {
      method: "GET",
      headers: { Authorization: "Bearer " + token },
    });

    const data = await result.json();
    return data.items;
  };

  const GetSong = async (Code, trackEndPoint) => {
    const result = await fetch(`${trackEndPoint}`, {
      method: "GET",
      headers: { Authorization: "Bearer " + Code },
    });

    const data = await result.json();
    return data;
  };

  return {
    getToken() {
      return GetToken();
    },
    getGenres(token) {
      return GetGen(token);
    },
    getPlaylistByGenre(token, genreId) {
      return GetPlaylist(token, genreId);
    },
    getTracks(token, tracksEndPoint) {
      return GetSongs(token, tracksEndPoint);
    },
    getTrack(token, trackEndPoint) {
      return GetSong(token, trackEndPoint);
    },
  };
})();

const UIController = (function () {
  //Created OBJ for html items
  const DOMElements = {
    selectGenre: "#select_genre",
    selectPlaylist: "#select_playlist",
    buttonSubmit: "#btnsearch",
    divSongDetail: "#song-detail",
    hfToken: "#hidden_token",
    divSonglist: ".song-list",
  };

  return {
    //GET input form user
    inputField() {
      return {
        genre: document.querySelector(DOMElements.selectGenre),
        playlist: document.querySelector(DOMElements.selectPlaylist),
        tracks: document.querySelector(DOMElements.divSonglist),
        submit: document.querySelector(DOMElements.buttonSubmit),
        songDetail: document.querySelector(DOMElements.divSongDetail),
      };
    },

    //GET Genre of song
    createGenre(text, value) {
      const html = `<option value="${value}">${text}</option>`;
      document
        .querySelector(DOMElements.selectGenre)
        .insertAdjacentHTML("beforeend", html);
    },

    createPlaylist(text, value) {
      const html = `<option value="${value}">${text}</option>`;
      document
        .querySelector(DOMElements.selectPlaylist)
        .insertAdjacentHTML("beforeend", html);
    },

    //GET list of songs
    CrSong(id, name) {
      const html = `<a href="#" class="list-group-item list-group-item-action list-group-item-light" id="${id}">${name}</a>`;
      document
        .querySelector(DOMElements.divSonglist)
        .insertAdjacentHTML("beforeend", html);
    },

    //GET details from the song like artist etc.
    createTrackDetail(img, title, artist) {
      const detailDiv = document.querySelector(DOMElements.divSongDetail);
      detailDiv.innerHTML = "";

      const html = `
            <div class="row col-sm-12 px-0">
                <img src="${img}" alt="">        
            </div>
                <div class="row col-sm-12 px-0">
                <label for="Genre" class="form-label col-sm-12">${title}:</label>
            </div>
            <div class="row col-sm-12 px-0">
                <label for="artist" class="form-label col-sm-12">By ${artist}:</label>
            </div> 
            `;

      detailDiv.insertAdjacentHTML("beforeend", html);
    },

    SongInfoReset() {
      this.inputField().songDetail.innerHTML = "";
    },

    SongReset() {
      this.inputField().tracks.innerHTML = "";
      this.SongInfoReset();
    },

    PlayLreset() {
      this.inputField().playlist.innerHTML = "";
      this.SongReset();
    },

    SavedToken(value) {
      document.querySelector(DOMElements.hfToken).value = value;
    },

    GETsavedToken() {
      return {
        token: document.querySelector(DOMElements.hfToken).value,
      };
    },
  };
})();

const APPController = (function (UICtrl, APICtrl) {

  const DOMInputs = UICtrl.inputField();

  //GET GENRE and populate fields
  const loadGenres = async () => {
    const token = await APICtrl.getToken();
    UICtrl.SavedToken(token);
    const genres = await APICtrl.getGenres(token);
    genres.forEach((element) => UICtrl.createGenre(element.name, element.id));
  };

  //Genre change will reset playlist and restart
  DOMInputs.genre.addEventListener("change", async () => {
    UICtrl.PlayLreset();
    const token = UICtrl.GETsavedToken().token;
    const genreSelect = UICtrl.inputField().genre;
    const genreId = genreSelect.options[genreSelect.selectedIndex].value;
    const playlist = await APICtrl.getPlaylistByGenre(token, genreId);
    playlist.forEach((p) => UICtrl.createPlaylist(p.name, p.tracks.href));
  });

  //submit events
  DOMInputs.submit.addEventListener("click", async (e) => {
    e.preventDefault();
    UICtrl.SongReset();
    const token = UICtrl.GETsavedToken().token;
    const playlistSelect = UICtrl.inputField().playlist;
    const tracksEndPoint =
      playlistSelect.options[playlistSelect.selectedIndex].value;
    const tracks = await APICtrl.getTracks(token, tracksEndPoint);
    tracks.forEach((el) => UICtrl.CrSong(el.track.href, el.track.name));
  });

  //song selection
  DOMInputs.tracks.addEventListener("click", async (e) => {
    e.preventDefault();
    UICtrl.SongInfoReset();
    const token = UICtrl.GETsavedToken().token;
    const trackEndpoint = e.target.id;
    const track = await APICtrl.getTrack(token, trackEndpoint);
    UICtrl.createTrackDetail(
      track.album.images[2].url,
      track.name,
      track.artists[0].name
    );
  });

  return {
    init() {
      console.log("App is starting");
      loadGenres();
    },
  };
})(UIController, SpotifyAPI);

APPController.init();
