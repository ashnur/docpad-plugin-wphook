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
        , vow = require('promises')
    ;
    function exists(path){
        return function(){
            var v = vow.make()
                ;
            fs.exists(path, function(exists){
                if ( exists ) {
                    v.keep(path)
                console.log(path, true)
                } else {
                    v.break(path)
                console.log(path, false)
                }
            })
            return v.promise
        }
    }

    function createdir(path){
        var v = vow.make()
            ;
        console.log('createdir:', path);
        fs.mkdir(
            path
            , function(err){
                if ( err ) {
                    v.break(err)
            console.log(path, 'failed to create')
                } else {
                    v.keep(path)
            console.log(path, 'created')
                }
            }
        )
        return v.promise
    }

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

    function handleImgs(post, imgs, imgdir, relativedir){
        return function(){
            var v = vow.make()
                ;
            imgs.forEach(
                function(img, i){
                    var imgname = urijs(img).filename()
                        ;
                    request(img).pipe(fs.createWriteStream(imgdir+'/'+imgname))

                    if ( i == 0 && post.thumbnail == null ) {
                        post.thumbnail = relativedir + imgname
                    }

                    post.content = post.content.replace(
                                        new RegExp(img, 'g')
                                        , relativedir + imgname
                                   )
                }
            )
            return v.promise
        }
    }

    function savepost(documentdir, post){
        return function(){
            var postcontent = post.content
                ;
            delete(post.content)

            post = _.extend(post, {wpurl: post.url, url: null, layout : 'articles'})
            docpad.createDocument(
                    {content:postcontent,fullPath: documentdir + '/index.html'}
                    , {data:postcontent, meta: post}
                ).writeSource(function(){docpad.action('generate')})
        }
    }

    function createDocument(category, post){

        var  categorydir = srcPath + '/documents/' + category
            , documentdir = srcPath + '/documents/' + category + '/' + post.slug
            , filescatdir = srcPath + '/files/' + category
            , postdir =  filescatdir + '/' + post.slug
            , imgdir = postdir + '/images'
            , relativedir = '/' + category + '/' + post.slug + '/images/'
            , docu = jsdom(post.content)
            , imgs = Array.prototype.slice.call(docu.getElementsByTagName('img'))
                            .map(function(img){ return img.src})
                            .concat(post.attachments.map(function(img){ return img.url}))
            ;

        if ( post.thumbnail != null ) {
            post.thumbnail = relativedir + urijs(post.thumbnail).filename()
        }

        exists(filescatdir)().when(null, createdir)
            .when(exists(postdir)).when(null, createdir)
            .when(exists(imgdir)).when(null, createdir)
            .when(exists(categorydir)).when(null, createdir)
            .when(exists(documentdir)).when(null, createdir)
            .when(handleImgs(post, imgs, imgdir, relativedir))
            .when(savepost(documentdir, post), failure)
    }

    function failure(){
        console.err(arguments)
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
                    var post = JSON.parse(body).post
                        ;
                    whichcats(post.categories).forEach(
                        function(category){
                            createDocument( category, post)
                        }
                    )
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
