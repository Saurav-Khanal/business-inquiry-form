const mongoose=require("mongoose");
const bcrypt=require("bcrypt");
const userSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true,
        trim:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true
    },
    password:{
        type:String,
        required:true
    }
})

userSchema.pre("save",async function(){
    if(!this.isModified('password')) return;
        const saltRounds=12;
        this.password=await bcrypt.hash(this.password,saltRounds);
})

module.exports=mongoose.model("User",userSchema);