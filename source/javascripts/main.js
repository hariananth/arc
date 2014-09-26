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
    var fetchCount = (ids.length > maxPrefetch ? maxPrefetch : ids.length);
    var completions = 0;
    for (var i=0; i<fetchCount; i++) {
      var headline = $($(".headline")[i]);
      var url = headline.attr("data-article_url");
      if (url && url.length > 0) {
        $.ajax({
          url: headline.attr("data-article_url"),
          async: false,
          success: articleHandler(headline),
          complete: function() {
            completions++;
            if (completions == fetchCount) {
              addArticleListeners();
            }
          }
        });
      }
    }
  }
  function addArticleListeners() {
    $("article").scroll(function() {
      $(this).find(".line:not(.bounceInLeft):not(.bounceInRight)").each(function() {
        if ($(this).visible(true)) {
          if ($(this.parentNode).hasClass("storyline-1")) {
            $(this).addClass("bounceInLeft");
          } else {
            $(this).addClass("bounceInRight");
          }
        }
      });
    });
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
    node.attr("data-article_url", headline.url || "/articles/"+id);
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
      var articleWithClasses = addClassesToMarkdown(articleHtml);
      article.find(".article").html(articleWithClasses);
      // append article to the body
      article.appendTo("body");
    };
  }
  function addClassesToMarkdown(articleHtml) {
    var dummyElement = $("<div />");
    dummyElement.html(articleHtml);
    // now we can parse the article html
    // The format of the story is such that each storyline is broken into
    // sections, which are separated by H1 elements.
    var storylines = {}; // {storyLine: idx}
    //$("p", dummyElement).wrapAll("<div class='block' />");
    $("h1", dummyElement).each(function(idx){
      var h1 = $(this);
      var storyline = h1.html();
      var wrapperClass = "block ";
      if (storyline in storylines) {
        wrapperClass += "storyline-"+storylines[storyline];
      } else {
        storylines[storyline] = Object.keys(storylines).length;
        wrapperClass += "storyline-"+storylines[storyline];
      }
      h1.nextUntil("h1").wrapAll("<div class='"+wrapperClass+"' />");
    });
    // add a "line" to the beginning of each block to signify the storyline
    $(dummyElement).find(".block").each(function() {
      $(this).prepend("<div class='line animated' />");
    });
    return dummyElement.html();
  }
  // fetch headlines
  $.getJSON("/articles/headlines.json", receivedHeadlines);
});
