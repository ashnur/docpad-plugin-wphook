var __hasProp = {}.hasOwnProperty
    , __extends = function(child, parent){
        var key
            ;

        for ( key in parent ) {
            if ( __hasProp.call(parent, key) ) child[key] = parent[key]
        }

        function ctor(){ this.constructor = child }
        ctor.prototype = parent.prototype

        child.prototype = new ctor()
        child.__super__ = parent.prototype

        return child
    }
;

module.exports = function(BasePlugin){
    "use strict"
    var HooksPlugin
        , categories = [
            'decoratiuni'
            , 'din-natura'
            , 'haine-si-accesorii'
            , 'inspiratie'
            , 'sanatate'
            , 'upcycling'
            ]
        , fs = require('fs')
        , _ = require('underscore')
        , request = require('request')
        , jsdom = require('jsdom').jsdom
        , srcPath = docpad.config.srcPath
        , outPath = docpad.config.outPath
        , urijs = require('URIjs')
    ;
    function whichcats(data){
        var cats = []
            ;
        data.map(function(cat){
            if ( categories.indexOf(cat.slug) !== -1 ) {
                return cats.push(cat.slug)
            }
        })
        return cats
    }
    function createDocument(postdir, post){
        var imgdir = srcPath + '/documents' + postdir + '/images'
            , imgname
            , _i
            , img
            , docu = jsdom(post.content)
            , imgs = docu.getElementsByTagName('img')
            , _len = imgs.length
            ;

        if ( !fs.existsSync(imgdir) ) { fs.mkdirSync(imgdir) }

        if ( post.thumbnail != null ) {
            post.thumbnail = postdir + '/images/' + urijs(post.thumbnail).filename()
        }

        for ( _i = 0; _i < _len; _i++ ) {
            img = imgs[_i]
            imgname = urijs(img.src).filename()
            request(img.src).pipe(fs.createWriteStream(imgdir + '/' + imgname))

            if ( _i == 0 && post.thumbnail == null ) {
                post.thumbnail = postdir + '/images/' + imgname
            }

            post.content = post.content.replace(
                                new RegExp(img.src, 'g')
                                , postdir + '/images/' + imgname
                           )
        }


        savepost(postdir, post)
    }

    function savepost(dir, post){
        var postcontent = post.content
            ;
        delete(post.content)

        post = _.extend(post, {wpurl: post.url, url: null, layout : 'articles'})
        docpad.createDocument(
                {content:postcontent,fullPath:srcPath + '/documents' + dir + '/index.html'}
                , {data:postcontent, meta: post}
            ).writeSource(function(){docpad.action('generate')})

    }

    function newpost(req){
        return request(
                { uri: urijs(process.env.WPHOST).addSearch({
                                'json': 'get_post'
                                , 'dev': 1
                                , 'id': req.body.ID
                                , 'custom_fields': 'slide_description'
                            }).toString()
                }, function(err, response, body){
                    if ( err ) { throw err }
                    var category
                        , post = JSON.parse(body).post
                        , _i
                        , _ref = whichcats(post.categories)
                        , _len = _ref.length
                        , postdir
                        ;
                    for ( _i = 0; _i < _len; _i++ ) {
                        category = _ref[_i]
                        postdir = srcPath + '/documents/' + category + '/' + post.slug
                        if ( ! fs.existsSync(postdir) ) { fs.mkdirSync(postdir) }
                        createDocument('/' + category + '/' + post.slug, post)
                    }
                }
        )
    }
    return HooksPlugin = (function(_super) {

        function HooksPlugin(){
            return HooksPlugin.__super__.constructor.apply(this, arguments)
        }

        __extends(HooksPlugin, _super)

        HooksPlugin.prototype.name = 'hooks'

        HooksPlugin.prototype.serverExtend = function(opts){
            var docpad = this.docpad, server = opts.server
            return require(__dirname + '/routes.js')({
                docpad: docpad,
                server: server,
                newpost: newpost
            })
        }

        return HooksPlugin

    })(BasePlugin)
}
