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
    var articles = $("article");
    // scroll listener to bounce in the markers
    articles.scroll(function() {
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
    // longpress listener to show nav overlay
    window.articlePressTimer;
    articles.mouseup(function() {
      // Clear timeout
      window.clearTimeout(window.articlePressTimer);
      return true;
    }).mousedown(function() {
      // Set timeout
      window.articlePressTimer = window.setTimeout(function() {
        $(".article-overlay").removeClass("previous");
        $(".article-overlay").toggleClass("hidden");
        $("nav.current").toggleClass("hidden");
      }, 500)
      return true; 
    })
  }
  function addHeadlineToPage(id, headline) {
    var node = $("#headline-template").clone().removeClass("hidden");
    node.find(".title").html(headline.title);
    node.find(".tagline").html(headline.tagline);
    node.find(".name").html(headline.author);
    node.find(".date").html(headline.date);
    node.find(".time").html(headline.time);
    if (headline.bookmarked) {
      node.find(".bookmark").removeClass("invisible");
      node.find(".overlay-bookmark").addClass("enabled");
    }
    node.removeAttr("id");
    node.addClass("headline");
    node.attr("data-goto", "article-"+id);
    node.attr("data-article_url", headline.url || "articles/"+id);
    node.appendTo("#headlines");

    // longpress listener on headline to show bookmark/share overlay
    var pressTimer;
    var showingOverlay = false;
    node.mouseup(function() {
      // Clear timeout
      window.clearTimeout(pressTimer);
      if (node.find(".headline-overlay").hasClass("hidden")) {
        showingOverlay = false;
      } else {
        setTimeout(function() {
          if (node.find(".headline-overlay").hasClass("hidden")) {
            showingOverlay = false;
          } else {
            showingOverlay = true;
          }
        }, 300);
      }
      return true;
    }).mousedown(function() {
      // Set timeout
      pressTimer = window.setTimeout(function() {
        node.find(".headline-text-container").toggleClass("overlayed");
        node.find(".headline-overlay").toggleClass("hidden");
      }, 500)
      return true; 
    }).click(function() {
      // if overlayed and click, kill overlay and clear timer
      if (showingOverlay) {
        node.find(".headline-text-container").removeClass("overlayed");
        node.find(".headline-overlay").addClass("hidden");
        window.clearTimeout(pressTimer);
        return false;
      }
    });
  }
  function articleHandler(headline) {
    // add a nav bar
    var navbar = $("#nav-template").clone().removeClass("hidden");
    navbar.removeAttr("id");
    navbar.find("h1").html(headline.find(".title").html());
    navbar.appendTo("body");
    return function(articleHtml) {
      var article = $("#article-template").clone().removeClass("hidden");
      // set goto path for ccui
      article.attr("id", headline.attr("data-goto"));
      // copy the headline info over
      article.find(".title").html(headline.find(".title").html());
      article.find(".tagline").html(headline.find(".tagline").html());
      article.find(".name").html(headline.find(".name").html());
      article.find(".date").html(headline.find(".date").html());
      article.find(".time").html(headline.find(".time").html());
      if (!headline.find("bookmark").hasClass("invisible")) {
        article.find(".bookmark").removeClass("invisible");
        article.find(".overlay-bookmark").addClass("enabled");
      }
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
  $.getJSON("articles/headlines.json", receivedHeadlines);
  // add article overlay listener to close the overlay on click
  // TODO open correct page on click
  $(".article-overlay").click(function() {
    // if overlayed and click, kill overlay and clear timer
    $("nav.current").removeClass("hidden");
    $(".article-overlay").removeClass("previous");
    $(".article-overlay").addClass("hidden");
    window.clearTimeout(window.articlePressTimer);
    return false;
  });
});
