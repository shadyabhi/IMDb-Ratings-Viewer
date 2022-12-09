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

  addRatingsListener() {
    document.querySelectorAll(".ipc-accordion__item__content").forEach(accordion => {
      var observer = new MutationObserver(mutationRecords => {
        mutationRecords.forEach(mutation => {
          if (mutation.type === "attributes" && mutation.target.className === "ipc-image") {
            this.setRating(mutation.target.closest("li"));
          }
        });
      });
      observer.observe(accordion, {
        subtree: true,
        attributeOldValue: true
      });
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
      if (element.nodeName == "LI") {
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
    var ttl = 3600*24*7;
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
      .ipc-inline-list .ipc-rating-star {
        margin-right: 9px !important;
        position: relative;
        top: 1px;
      }
    `;

    document.getElementsByTagName("head")[0].appendChild(style);
  }

  getMovieLinkFromElement(element) {
    // we strip query string since we don't need it
    // When adding as text
    if (element.nodeName == "LI") {
      return element.getElementsByTagName("a")[0].href.split("?")[0];
    }
  }
  getRegularMovieElements() {
    return Array.from(document.querySelectorAll("ul.ipc-metadata-list:not(.date-unrel-credits-list) li.ipc-metadata-list-summary-item"));
  }

  /* Add ratings */
  addRatingAsText(element, rating) {
    if (rating != null) {
      var metaRows = element.querySelector("div.ipc-metadata-list-summary-item__tc");
      var subtitleRows = metaRows.querySelectorAll("ul.ipc-metadata-list-summary-item__stl");
      if (subtitleRows.length === 0) {
        var ul = document.createElement("ul");
        var li = document.createElement("li");
        ul.appendChild(li);
        var subtitleRowNew = metaRows.appendChild(ul);
      }
      var subtitleRow = subtitleRowNew || subtitleRows[0];
      var ratingStar = document.querySelector(".ipc-rating-star-group").cloneNode(true);

      if (rating > 6.5) {
        ratingStar.childNodes[0].childNodes[0].setAttribute("fill", "red");
      }

      ratingStar.childNodes[0].childNodes[1].nodeValue = rating;
      subtitleRow.childNodes[0].insertAdjacentHTML("beforeBegin", ratingStar.innerHTML);
    }
  }
}

function main() {
  let imdb = new IMDBRatings();
  imdb.addRatingsToPage();
  imdb.addRatingsListener();
}

main();
