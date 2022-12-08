class IMDBRatings {
  constructor() {
    this.page = new IMDBPage();
  }

  addRatingsToPage() {
    this.page
      .getRegularMovieElements()
      .forEach((ele) => {
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
    }

    var url = this.page.getMovieLinkFromElement(element);
    var titleId = url.replace(/.*\/(.*?)\//, "$1");

    fetch("https://api.graphql.imdb.com/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Origin": "https://www.imdb.com",
      },
      body: JSON.stringify({
        query: `
          query getRating($titleId: ID!) {
            title(id: $titleId) {
              ratingsSummary {
                voteCount
                aggregateRating
              }
            }
          }
        `,
        operationName: "getRating",
        variables: {
          titleId: titleId,
        },
      }),
    })
    .then((res) => res.json())
    .then((result) => this.processRespAndSetRating(element, result.data.title.ratingsSummary))
  }

  processRespAndSetRating(element, ratingsSummary) {
    var rating = ratingsSummary.aggregateRating;
    if (rating != null) {
      this.setRatingInCache(element, rating);
      if (element.nodeName == "DIV") {
        this.page.addRatingAsText(element, rating);
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

  getMovieLinkFromElement(element) {
    // we strip query string since we don't need it
    // When adding as text
    if (element.nodeName == "DIV") {
      return element.getElementsByTagName("a")[0].href.split("?")[0];
    }
  }
  getRegularMovieElements() {
    return Array.from(document.getElementsByClassName("filmo-row"));
  }

  /* Add ratings */
  addRatingAsText(element, rating) {
    if (rating != null) {
      element.childNodes[3].appendChild(this.getRatingElement(rating));
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
