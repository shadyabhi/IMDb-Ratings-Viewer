class IMDBRatings {
  constructor() {
    this.page = new IMDBPage();
  }

  addRatingsToPage() {
    this.page
      .getKnownForElements()
      .concat(this.page.getRegularMovieElements())

      .forEach((ele) => {
        this.setRating(ele);
      });

    this.page.getAllPosters().forEach((ele) => {
      this.setRating(ele);
    });
  }

  setRating(element) {
    // fast path
    var rating = this.getRatingFromCache(element);
    if (rating != null) {
      if (element.nodeName == "DIV") {
        return this.page.addRatingAsText(element, rating);
      }

      if (element.nodeName == "IMG") {
        return this.page.addRatingOnPoster(element, rating);
      }
    }

    // ajax if not found in cache
    var request = new XMLHttpRequest();
    request.onreadystatechange = () => {
      if (request.readyState == 4) {
        this.processRespAndSetRating(element, request);
      }
    };

    request.open("GET", this.page.getMovieLinkFromElement(element), true);
    request.send();
  }

  processRespAndSetRating(element, request) {
    var serverResponse = request.responseText;
    var pattern = /ratingValue\"\>(.*?)\</;
    var rating = null;
    var match_rating = serverResponse.match(pattern);
    if (match_rating != null) {
      rating = match_rating[1];
    }
    if (rating != null) {
      this.setRatingInCache(element, rating);
      if (element.nodeName == "DIV") {
        this.page.addRatingAsText(element, rating);
      }
      if (element.nodeName == "IMG") {
        this.page.addRatingOnPoster(element, rating);
      }
    }
  }

  /* Local Storage related methods */
  getRatingFromCache(element) {
    var key = this.page.getMovieLinkFromElement(element);
    var itemJsonStr = localStorage.getItem(key);

    if (!itemJsonStr) {
      return null;
    }

    var item = JSON.parse(itemJsonStr);
    var now = new Date();
    if (!item.expiry || now.getTime() > item.expiry) {
      localStorage.removeItem(key);
      return null;
    }

    return item.value;
  }

  setRatingInCache(element, rating) {
    var key = this.page.getMovieLinkFromElement(element);
    var now = new Date();
    var ttl = 604800000; // 1 week
    var item = {
      value: rating,
      expiry: now.getTime() + ttl,
    };
    localStorage.setItem(key, JSON.stringify(item));
  }
}

// IMDBPage is used to interact with IMDB.com pages
class IMDBPage {
  constructor() {
    this.addStyleSheet();
  }

  addStyleSheet() {
    // Create class to style the rating value
    var style = document.createElement("style");
    style.type = "text/css";
    style.id = "irv-extension-style";
    style.innerHTML = `
      .rating-value {
        color: black;
        background-color: #EFE3A4;
        display: inline;
        padding: .2em .2em .2em;
        font-size: 100%;
        font-weight: 700;
        line-height: 1;
        text-align: center;
        white-space: nowrap;
        vertical-align: baseline;
        border-radius: .25em; margin: 4px;
      }

      .rating-value-poster {
        position: absolute;
        top: 0.4em;
        right: 0em;
      }
      `;

    document.getElementsByTagName("head")[0].appendChild(style);
  }

  /* Find elements where ratings need to be added */
  getKnownForElements() {
    var knownFor = document.getElementById("knownfor");
    if (knownFor == null) {
      return [];
    }

    let filtered = Array.from(knownFor.childNodes).filter(function (ele) {
      return ele.nodeName != "#text";
    });
    return filtered;
  }

  getMovieLinkFromElement(element) {
    // we strip query string since we don't need it
    // When adding as text
    if (element.nodeName == "DIV") {
      return element.getElementsByTagName("a")[0].href.split("?")[0];
    }
    // When adding on a poster
    if (element.nodeName == "IMG") {
      return element.parentElement.href.split("?")[0];
    }
  }
  getRegularMovieElements() {
    return Array.from(document.getElementsByClassName("filmo-row"));
  }

  getAllPosters() {
    var similarMovies = Array.from(
      document.querySelectorAll('a > img[class="loadlate rec_poster_img"')
    );

    var trendingMovies = Array.from(
      document.querySelectorAll('a > img[class="pri_image"')
    ).filter(function (ele) {
      return ele.parentElement.href.includes("/title");
    });

    return similarMovies.concat(trendingMovies);
  }

  /* Add ratings */
  addRatingAsText(element, rating) {
    if (rating != null) {
      element.childNodes[3].appendChild(this.getRatingElement(rating));
    }
  }

  addRatingOnPoster(element, rating) {
    if (rating != null) {
      var container = this.getRatingElement(rating);
      container.classList.add("rating-value-poster");

      element.parentElement.style.position = "relative";
      element.parentElement.prepend(container);
    }
  }

  getRatingElement(rating) {
    var container = document.createElement("span");
    var rating_container = document.createElement("span"); //Did this crap to make brackets black
    rating_container.appendChild(document.createTextNode(rating));
    rating_container.className = "rating-value";

    if (rating < 6.5) {
      rating_container.style.backgroundColor = "#fabdb4";
    }
    container.appendChild(rating_container);
    return container;
  }
}

function main() {
  let imdb = new IMDBRatings();
  imdb.addRatingsToPage();
}

main();
