/*
Author: shadyabhi (Abhijeet Rastogi)
Email: abhijeet.1989@gmail.com
*/

function addRating(url, element)
{
    var request = new XMLHttpRequest();
    request.onreadystatechange = function()
    {   
        if ( request.readyState == 4 ) 
        {   
            callback_addrating( request.responseText, element, request.status );    
        }   
    };  
    request.open( "GET", url, true );
    request.send()
}

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

function callback_addrating(serverResponse, element, status){

    var pattern=/itemprop=\"ratingValue\"\>(.*?)\</;
    var rating = null;
    var match_rating = serverResponse.match(pattern);
    if (match_rating != null) rating = match_rating[1];
    
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

function main(){
    try{
        //For suggestions
        var ele_knownfor = document.getElementById("knownfor");
        for (i=1; i<=7; i=i+2){ //Assumed number as 4
            var ele_moviename = ele_knownfor.childNodes[i];
            var movie_link = ele_moviename.childNodes[5].href;
            addRating(movie_link, ele_moviename.childNodes[5]);
        }
    }
    catch (err) {}; 
    all_elements = getMovieElements();
    for (i=0; i<all_elements.length; i++){
        var movie_link = all_elements[i].childNodes[3].childNodes[1].href;
        addRating(movie_link, all_elements[i].childNodes[3]);
    }
}

main()
