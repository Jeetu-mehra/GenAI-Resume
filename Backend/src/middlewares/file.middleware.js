const multer = require("multer")


const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    },
    fileFilter: (req, file, cb) => {
        // Validate file type
        const allowedMimes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
        const allowedExtensions = ['.pdf', '.docx']
        
        const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'))
        
        if (!allowedMimes.includes(file.mimetype) || !allowedExtensions.includes(fileExtension)) {
            return cb(new Error('Only PDF and DOCX files are allowed'), false)
        }
        
        cb(null, true)
    }
})


module.exports = upload