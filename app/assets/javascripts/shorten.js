(function() {

  "use strict"

  var input, go, results, popular, clipboard, // our references to DOM elements
    domainPrefix = document.location.origin // the string we prepend to keys delivered from the server

  /* Connect to /api/create and retreive a key for a new shortened URL */
  function create() {
    var url = input.val()
    if (validURL(url)) {
      $.ajax({ url: '/api/create', type: 'POST', data: { url: url } })
        .done(function(r) {
          if (r.status == 'ok') {
            input.val('')
            var result = addResult(r.data, url)
            if (copyToClipboard(domainPrefix + '/' + r.data))
              input.notify('Copied to clipboard', { position: 'bottom center', className: 'success' })
            populateScoreboard()
          } else {
            input.notify(r.msg, { position: 'bottom center', className: 'error' })
          }
        });
    } else {
      input.notify('Please enter a valid URL', { position: 'bottom center', className: 'warn' })
    }
  }

  /* Add a shortened URL result to the list under the input box. */
  function addResult(key, url) {
    var result = createLink(key, url)
    results.prepend(result)
    $.each(
      $.grep(results.children(), function(n, i) { return n < 7; }),
      function(i, o) {
        $(o).remove();
      }
    )
    return result
  }

  /* Create a DOM node with a structure like:
   *  <li><a href="" target="_blank">urlprefix/<em>key</em> extra</a></li>
   */
  function createLink(key, title, extra) {
    return $('<li><a href="' + domainPrefix + '/' + key + '" title="' + title + '" target="_blank">' + domainPrefix.replace('http://', '') + '/<em>' + key + '</em> ' + (extra ? extra : '') + '</a></li>')
  }

  /* populate the top scoreboard. */
  function populateScoreboard() {
    $.ajax({ url: '/api/scoreboard', type: 'POST' })
    .done(function(r) {
      popular.empty()
      if (r.status == 'ok') {
        $.each(r.data, function(i, o) {
          var t = o.url.replace(/(http:\/\/|https:\/\/|www\.)/gi, '')
          if (t.length > 16) t = t.substr(0,14) + '..'
          popular.append(createLink(o.key, o.url, ' => ' + t ))
        });
      } else {
        popular.notify(r.msg, { position: 'bottom center', className: 'warn' })
      }
    });
  }

  // from http://stackoverflow.com/questions/1303872/trying-to-validate-url-using-javascript
  function validURL(url) {
    return /^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(url)
  }

  // copy something to the clipboard. returns true or false on succes or failure to do so
  function copyToClipboard(text) {
    var successful = false
    clipboard.val(text)
    clipboard[0].select()
    try {
      successful = document.execCommand('cut')
    } catch (err) {
      // successful is already false
    }
    //input.focus()
    return successful
  }

  /* initialize our app */
  $(document).ready(function() {
    // assign our dom elements some references
    input = $('.create input')
    go = $('.create button')
    results = $('.result ul')
    popular = $('.popular ul')
    clipboard = $('.clipboard')

    // hook on some event handlers
    input.keyup(function(e) {
      if(e.keyCode == 13)
        create()
    })
    go.click(create)

    // try focus the input element
    input.focus()

    // populate the scoreboard
    populateScoreboard()
  });


})();
