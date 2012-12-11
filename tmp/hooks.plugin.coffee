# Export Plugin
module.exports = (BasePlugin) ->
    fs = require 'fs'
    urijs = require 'URIjs'
    request = require 'request'
    tomd = require('to-markdown').toMarkdown

    wphost = 'http://localhost/'
    wpuri = urijs(wphost)

    srcPath = docpad.config.srcPath
    outPath = docpad.config.outPath

    categories = [ 'decoratiuni'
       , 'din-natura'
       , 'haine-si-accesorii'
       , 'inspiratie'
       , 'sanatate'
       , 'upcycling'
    ]

    whichcats = (data) ->
        cats = []
        data.map((cat)->
            if categories.indexOf(cat.slug) != -1
                cats.push cat.slug
        )
        cats



    createDocument = (directory, attachments, post, savepost) ->
        imgdir = srcPath  + '/documents'+directory+'/images'
        if ! fs.existsSync imgdir then fs.mkdirSync imgdir
        for att in attachments
            #save each attachment
            imgname = urijs(att.url).filename()
            request(att.url).pipe(fs.createWriteStream(imgdir+'/'+imgname))

            #replace the url
            post.content = post.content.replace(new RegExp(att.url,'g'), outPath+directory+'/images/'+imgname)
        savepost directory, post

    savepost = ( dir, post ) ->
        doc = '---\n'
        doc += "layout: 'article'\n"
        doc += "title: '"+post.title+"'\n"
        doc += "date: '"+post.date+"'\n"
        doc += "tags: '"+post.tags.map((o)->o.title).join(', ')+"'\n"
        doc += "author: '"+post.author.nickname+"'\n"
        doc += '---\n\n'
        doc += tomd(post.content)+'\n'
        doc += '\n'
        fs.writeFile dir+'/index.html.md', doc, 'utf8', (err) ->
            if (err) then throw err
            docpad.action('generate')

    get_saver = (req) ->
        return (err, response, body)->
            if ( err ) then throw err
            post = JSON.parse(body).post
            for category in whichcats post.categories
                if ! fs.existsSync srcPath + '/documents/'+category+'/'+post.slug
                    fs.mkdirSync(srcPath + '/documents/'+category+'/'+post.slug)
                createDocument('/'+category+'/'+post.slug, post.attachments, post, savepost)



    newpost = (req) ->
        request({uri:wpuri.addSearch({'json':'get_post','dev':1,'id':req.body.ID}).toString()}, get_saver(req) )

    # Define Plugin
    class HooksPlugin extends BasePlugin
        # Plugin name
        name: 'hooks'

        # Server Extend
        # Used to add our own custom routes to the server before the docpad routes are added
        serverExtend: (opts) ->
            # Extract the server from the options
            {server} = opts
            docpad = @docpad

            require(__dirname+'/routes.coffee')({docpad, server, newpost })







