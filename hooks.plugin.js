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
        , request = require('request')
        , srcPath = docpad.config.srcPath
        , outPath = docpad.config.outPath
        , tomd = require('to-markdown').toMarkdown
        , urijs = require('URIjs')
        , wphost = 'http://localhost/'
        , wpuri = urijs(wphost)
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
    function createDocument(directory, attachments, post, savepost){
        var att
            , imgdir = srcPath + '/documents' + directory + '/images'
            , imgname
            , _i
            , _len = attachments.length
            ;
        if ( !fs.existsSync(imgdir) ) { fs.mkdirSync(imgdir) }
        for ( _i = 0; _i < _len; _i++ ) {
            att = attachments[_i]
            imgname = urijs(att.url).filename()
            request(att.url).pipe(fs.createWriteStream(imgdir + '/' + imgname))
            post.content = post.content.replace(
                                new RegExp(att.url, 'g')
                                , directory + '/images/' + imgname
                           )
        }
        return savepost(directory, post)
    }

    function savepost(dir, post){
        var doc = '---\n'
            ;
        doc += "layout: 'article'\n"
        doc += "title: '" + post.title + "'\n"
        doc += "date: '" + post.date + "'\n"
        doc += "tags: '" + post.tags.map(function(o){return o.title}).join(', ') + "'\n"
        doc += "author: '" + post.author.nickname + "'\n"
        doc += '---\n\n'
        doc += tomd(post.content) + '\n'
        doc += '\n'
        return fs.writeFile(srcPath + '/documents' + dir + '/index.html.md', doc, 'utf8', function(err){
            if ( err ) { throw err }
            return docpad.action('generate')
        })
    }

    function newpost(req){
        return request({ uri: wpuri.addSearch({
                                'json': 'get_post'
                                , 'dev': 1
                                , 'id': req.body.ID
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
                createDocument('/' + category + '/' + post.slug, post.attachments, post, savepost)
            }
        })
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
