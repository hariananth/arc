$(window).load(function() {
  // helper functions
  function receivedHeadlines(headlines) {
    $("#loading").addClass("hidden");
    var ids = Object.keys(headlines);
    // first add the headlines to the page (immediately visible)
    for (var i=0; i<ids.length; i++) {
      addHeadlineToPage(ids[i], headlines[ids[i]]);
    }
    // now prefetch the first 3 stories
    var maxPrefetch = 3;
    for (var i=0; i<(ids.length>maxPrefetch?maxPrefetch:ids.length); i++) {
      var headline = $($(".headline")[i]);
      $.ajax({
        url: headline.attr("data-article_url"),
        async: false,
        success: articleHandler(headline)
      });
    }
  }
  function addHeadlineToPage(id, headline) {
    var node = $("#headline-template").clone().removeClass("hidden");
    node.find(".title").html(headline.title);
    node.find(".tagline").html(headline.tagline);
    node.find(".name").html(headline.author);
    node.find(".date").html(headline.date);
    node.find(".time").html(headline.time);
    node.removeAttr("id");
    node.addClass("headline");
    node.attr("data-goto", "article-"+id);
    node.attr("data-article_url", headline.url || "/articles/"+id+".html");
    node.appendTo("#headlines");
  }
  function articleHandler(headline) {
    // add a nav bar
    var navbar = $("#nav-template").clone().removeClass("hidden");
    navbar.find("h1").html(headline.find(".title").html());
    navbar.appendTo("body");
    return function(articleHtml) {
      var article = $("#article-template").clone().removeClass("hidden");
      // set goto path for ccui
      article.attr("id", headline.attr("data-goto"));
      // copy the headline info over
      article.find(".title").html(headline.find(".title").html());
      article.find(".tagline").html(headline.find(".tagline").html());
      article.find(".name").html(headline.find(".author").html());
      article.find(".date").html(headline.find(".date").html());
      article.find(".time").html(headline.find(".time").html());
      // dump the article text
      article.find(".article").html(articleHtml);
      // append article to the body
      article.appendTo("body");
    };
  }
  // fetch headlines
  $.getJSON("/articles/headlines.json", receivedHeadlines);
});
