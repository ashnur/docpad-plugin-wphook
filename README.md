#Installation instructions for version 0.0.0

#Wordpress
    - latest, default install
    - depending on where the docpad is going to be run, this install have to be reachable over http
        - I've tried succesfully http://localhost/ for WP and http://localhost:9778/ for docpad and also two appfog installs worked just as fine. Both of the apps are calling eachother, so that's why you can't hide one of them behind NAT or something similar.

    - Plugins needed:
        - http://www.advancedcustomfields.com/docs/getting-started/installation/
        - http://wordpress.org/extend/plugins/json-api/installation/
        - http://mitcho.com/code/hookpress/

    - Plugins configuration:

        Custom Fields are for a slider, I needed a better way to provide description for the slide images than the WP default excerpt because that as too long, and had html in it.

        The way I set this up, is I added a new Field Group with the name "Slide Options", with one rule in Location as "Post Type" "is equal to" "post". Order Nr. 0, Position: Normal, Style: No Metabox, and all Hide checkboxes unchecked. (so nothing to be hidden)
        I added a field with the label: Slide description name: slide_description type: Text  (instruction doesn't matter, but I have: "Very short, few words description for the post to appear as overlay on the post's slide image." ), It is a required field, has no Default value, Formatting: none, Conditional Logic: No.

       Under Settings/Webhooks where I added a hook to the docpad install with the values:
        - hook type: action
        - action: publish_post
        - Fields: "ID"
        - url: http://localhost:9778/hook/new-post


       IIRC the JSON API does not require any setup, the Core has to be Activated and that should be all.

##Docpad
    The repo at https://github.com/ashnur/docpad-plugin-wphook should work by default with the WP settings specified above.

##Using the plugin

    This is for a relatively narrow use-case, so it has some expectations embedded in it.
    When a post is saved in WP, it notifies the plugin, which then does the following:
        - requests the posts data through the JSON API.
        - in the hooks.plugin.js file there is a categories array declared which contains the slug of 7 predefined Categories. The Category term here refers to the attribute with the same name in Wordpress. In order to an article to be saved it should have at least one Category specified in Wordpress which's slug would match an arrey element from the category array.
        - then the plugin checks if all the directories exists or not, and if there is any directory missing, creats them
        - after this, find the images in the post.content loops over them scrapes them, and saves under the files/<category-slug>/<post-slug>/images, and replaces all src occurences in the post.content to a relative url which would point to where the image was saved.
        - when all the images are saved(or at least the saving is started, and the post.content is updated with the new urls, it creates a new docpad document, and saves it in the document/<category-slug>/<post-slug>.html.md and regenerates the output of the site.
