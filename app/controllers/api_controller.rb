require 'uri'

class ApiController < ApplicationController

  # a static page that serves as the frontend of this app
  def index

  end

  # should be called via post. will return a key to be appended onto our domain which together
  # will constitute the shortened url.
  def create
    def default_url_options
      { url: "" }
    end

    # some simple error checking. source - http://stackoverflow.com/questions/1805761/check-if-url-is-valid-ruby
    if not params[:url] =~ /\A#{URI::regexp(['http', 'https'])}\z/
      render json: { status: "er", msg: "Please enter a valid URL", data: nil }
      return
    end

    # create the new link.
    @link = Link.new(key: getNextHash, url: params[:url], views: 0)
    @link.save

    # return to requesting party
    render json: { status: "ok", msg: "URL shortened.", data: @link.key }
  end

  # a catch all function that tries to find a url in the database and if found, redirect the
  # request to that url. if not, lets show a nice not-found page.
  def view
    def default_url_options
      { key: "" }
    end

    # if its blank then give an error page
    if params[:key] == ""
      render "error_pages/404"
      return
    end

    @link = Link.where(key: params[:key]).first

    if @link == nil
      render "error_pages/404"
      return
    end

    # link is found. increment counter, send the redirect, & update scoreboard if required.
    @link.views += 1
    @link.save

    redirect_to @link.url

    if @link.views > Rails.application.config.scoreboardBound
      # insert into or update entry in leaderboard
      @top = TopScore.where({key: @link.key})
      if @top.length == 0
        @t = TopScore.new(key: @link.key, url: @link.url, views: @link.views)
        @t.save
      else
        @t = @top[0]
        @t.views = @link.views
        @t.save
      end

      # check leaderboard has not overgrown
      @top = TopScore.where({}).order_by(views: 'desc')
      if @top.length >= Rails.application.config.scoreboardSize
        Rails.application.config.scoreboardBound = @top[Rails.application.config.scoreboardSize - 1].views
        for i in Rails.application.config.scoreboardSize .. @top.length - 1
          @t = @top[i]
          @t.delete
        end
      else
        Rails.application.config.scoreboardBound = 0
      end
    end
  end

  # return a list of links in the scoreboard
  def scoreboard
    @top = TopScore.where({}).order_by(views: 'desc')
    render json: { status: "ok", msg: "The current leaders are...", data: @top }
  end

  # a global counter is stored in mongodb. get the counter, increment it, and use it for the next hash.
  def getNextHash
    # get last value, increment it, and save
    @counter = Counter.where(name: "url")[0]
    @counter.value = @counter.value + 1
    @counter.save

    # salt the counter, and return as 'hash' value
    @hashids = Hashids.new("this is my salt")
    return @hashids.encode(@counter.value)
  end

end
