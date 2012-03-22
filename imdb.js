/*
Author: shadyabhi (Abhijeet Rastogi)
Email: abhijeet.1989@gmail.com
*/

/*MISC FUNCTIONS*/

//Get rating value from localStorage
function getRating_localStorage(element, typeOfElement){
    var movie_link = getMovieLinkFromElement(element, typeOfElement);
    var rating = localStorage.getItem(movie_link);
    //If found, it's fine;else null is returned
    return rating;
}

//Returns movie link from element object
function getMovieLinkFromElement(element, typeOfElement){
    if (typeOfElement == "normal") return element.childNodes[3].childNodes[1].href;
    if (typeOfElement == "knownfor") return element.childNodes[5].href; 
}

//Returns a NodeList containing all Movie Elements
function getMovieElements(){
    //All Movie elements are in 2 different classes (they do it for different color tones
    var ele_even = document.getElementsByClassName("filmo-row even");
    var ele_odd = document.getElementsByClassName("filmo-row odd");

    //Reoder the elements as right now, Nodelist for odd and even are separated.
    var all_elements = new Array(ele_even.length + ele_odd.length);
    var index = 0;
    var max = ele_odd.length > ele_even.length?ele_odd:ele_even;

    for (i=0; i<max.length; i++){
        if (i < ele_odd.length) all_elements[index++] = ele_odd[i];
        if (i < ele_even.length) all_elements[index++] = ele_even[i];
    }
    return all_elements;
}

/*END OF MISC FUNCTIONS*/


//typeOfElement bcos we do a getMovieLinkFromElement() call
function getRating_ajax(element, typeOfElement)
{
    var request = new XMLHttpRequest();
    request.onreadystatechange = function(){
        if ( request.readyState == 4 ){
            callback_getAndsetRating_ajax(element, request, typeOfElement);
        }
    };
    request.open( "GET", getMovieLinkFromElement(element, typeOfElement), true );
    request.send();
}



function callback_getAndsetRating_ajax(element, request, typeOfElement){
    var serverResponse = request.responseText;
    var pattern=/itemprop=\"ratingValue\"\>(.*?)\</;
    var rating = null; 
    var match_rating = serverResponse.match(pattern);
    if (match_rating != null){
        rating = match_rating[1];
    }
    if (rating != null){
        localStorage.setItem(getMovieLinkFromElement(element, typeOfElement), rating);
        if (typeOfElement == "normal") addRating_inpage(element.childNodes[3], rating);
        if (typeOfElement == "knownfor") addRating_inpage(element.childNodes[5], rating);
    }
}

//Adds rating only if rating is found else nothing is done
function addRating_inpage(element, rating){
    console.log(element); 
    if (rating != null){
        var container = document.createElement("span");
        var rating_container = document.createElement("span");  //Did this crap to make brackets black
        rating_container.appendChild(document.createTextNode(rating));
        rating_container.className = "in_production";   //Give it a red color to mantain consistency
        container.appendChild(document.createTextNode(" ("));
        container.appendChild(rating_container);
        container.appendChild(document.createTextNode(")"));
        element.appendChild(container);
    }
}

//Wrapper to setRating for an element
function setRating(element, typeOfElement){
    var rating = null;
        //First check in localStorage
        rating = getRating_localStorage(element, typeOfElement);
        if (rating == null){
            //Not found in localStorage
            rating = getRating_ajax(element, typeOfElement);
        }
        else{
            if (typeOfElement == "normal") addRating_inpage(element.childNodes[3], rating);
            if (typeOfElement == "knownfor") addRating_inpage(element.childNodes[5], rating);
        }
}    

function main(){
    //Ratings will be added in two phases. First the Knownfor part.
    try{
        //For suggestions
        var ele_knownfor = document.getElementById("knownfor");
        for (i=1; i<=7; i=i+2){ //Assumed number as 4
            setRating(ele_knownfor.childNodes[i], "knownfor");
        }
    }
    catch (err) {}; //Catches Exception when KnownFor is not present for certains Actors.
    
    //Now comes the chance of the mainlist of movies.
    all_elements = getMovieElements();
    for (i=0; i<all_elements.length; i++){
        setRating(all_elements[i], "normal");
    }
}

main()
