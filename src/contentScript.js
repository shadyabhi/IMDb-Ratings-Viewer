class IMDBPage {
  /* Add ratings to page */
  addRatings() {
    var knownForElements = this.getKnownForElements();
    Array.from(knownForElements).forEach((ele) => {
      this.setRating(ele);
    });

    var regularMovieElements = this.getRegularMovieElements();
    Array.from(regularMovieElements).forEach((ele) => {
      this.setRating(ele);
    });
  }

  addRatingOnMovieElement(element, rating) {
    // Create class to style the rating value
    var style = document.createElement("style");
    style.type = "text/css";
    style.innerHTML =
      ".rating-value { color: black; background-color: #EFE3A4; display: inline; padding: .2em .6em .3em; font-size: 75%; font-weight: 700; line-height: 1; text-align: center; white-space: nowrap; vertical-align: baseline; border-radius: .25em; margin: 4px;}";

    document.getElementsByTagName("head")[0].appendChild(style);

    if (rating != null) {
      var container = document.createElement("span");
      var rating_container = document.createElement("span"); //Did this crap to make brackets black
      rating_container.appendChild(document.createTextNode(rating));
      rating_container.className = "rating-value";
      container.appendChild(rating_container);

      element.childNodes[3].appendChild(container);
    }
  }

  setRating(element) {
    // fast path
    var rating = this.getRatingFromCache(element);
    if (rating != null) {
      return this.addRatingOnMovieElement(element, rating);
    }

    // ajax if not found in cache
    var request = new XMLHttpRequest();
    request.onreadystatechange = () => {
      if (request.readyState == 4) {
        this.parseResponse(element, request);
      }
    };

    request.open("GET", this.getMovieLinkFromElement(element), true);
    request.send();
  }

  getMovieLinkFromElement(element) {
    // we strip query string since we don't need it
    return element.getElementsByTagName("a")[0].href.split("?")[0];
  }

  parseResponse(element, request) {
    var serverResponse = request.responseText;
    var pattern = /ratingValue\"\>(.*?)\</;
    var rating = null;
    var match_rating = serverResponse.match(pattern);
    if (match_rating != null) {
      rating = match_rating[1];
    }
    if (rating != null) {
      this.setRatingInCache(element, rating);
      this.addRatingOnMovieElement(element, rating);
    }
  }

  /* Movie Element Getters */
  getKnownForElements() {
    var all = document.getElementById("knownfor").childNodes;
    let filtered = Array.from(all).filter(function (ele) {
      return ele.nodeName != "#text";
    });
    return filtered;
  }

  getRegularMovieElements() {
    var all_elements = document.getElementsByClassName("filmo-row");
    return all_elements;
  }

  /* Local Storage related methods */
  getRatingFromCache(element) {
    return localStorage.getItem(this.getMovieLinkFromElement(element));
  }

  setRatingInCache(element, rating) {
    localStorage.setItem(this.getMovieLinkFromElement(element), rating);
  }
}

let page = new IMDBPage();
page.addRatings();
