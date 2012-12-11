# Our custom routes for our DocPad Server
# Loaded via our require in the serverExtend event in our docpad.coffee configuration file
module.exports = ({server,docpad, newpost}) ->
    # As we are now running in an event,
    # ensure we are using the latest copy of the docpad configuration
    # and fetch our urls from it
    config = docpad.getConfig()
    oldUrls = config.templateData.site.oldUrls or []
    newUrl = config.templateData.site.url

    # Redirect any requests accessing one of our sites oldUrls to the new site url
    server.use (req,res,next) ->
        if req.headers.host in oldUrls
            res.redirect(newUrl+req.url, 301)
        else
            next()

    server.post '/hook/new-post', ( req, res) ->
        newpost req
        res.end()
