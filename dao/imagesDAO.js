let chunks
let files

export default class ImagesDao {
    static async injectDB(conn) {
        if(chunks) {
            return
        }
        try{
            chunks = await conn.db(process.env.RESTQUIZ_NS).collection("uploads.chunks")
            files = await conn.db(process.env.RESTQUIZ_NS).collection("uploads.files")
        } catch (e) {
            console.error(
                `Unable to establish a collection handle in chunksDAO`
            )
        } 
    }

    static async getImagesForCategoriesGroups(categories) {
            for(let i=0; i<categories.length; i++){
                try{
                    let id = categories[i]._id
                    let image = await files.findOne({ image_of_id: id})

                    let idOfImage = image._id
                    let imageData = await chunks.findOne({files_id: idOfImage})
                    categories[i].image = imageData.data
                }
                catch(e){
                   console.log(e)
                }
            }
            return categories
            
    }

    static async getImageForOneCategory(categoryGroupId) {
        try{
            let image = await files.findOne({ image_of_id: categoryGroupId._id})
            let idOfImage = image._id
            let imageData = await chunks.findOne({files_id: idOfImage})
            return imageData.data
        }
        catch(e){
           console.log(e)
        }
    }


}