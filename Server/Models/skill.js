import mongoose from "mongoose";

const skillSchema=new mongoose.Schema({
    name:{ type:String , required:true, },
    description:{ type:String, required:true, },
    rank:{ type:String, required:true, enum: ['E', 'D', 'C','B','A','S'] },
    icon:{ type:String,  default: 'https://wallpapers.com/images/hd/solo-leveling-jin-woo-digital-painting-gumjz853la1lvepj.jpg' },
    statRequired:[{
        stat:{ type:String, required:true, enum: ['strength', 'agility', 'intelligence', 'endurance', 'charisma'] },
        value:{ type:Number, required:true, min: 0 }
    }],
    minLevel:{ type:Number, default: 1 },
    effect: {
      type: { type: String, enum: ['xp_multiplier', 'coin_multiplier', 'stat_bonus'], default: null },
      value: { type: Number, default: 0 },
      stat: { type: String, enum: ['strength', 'agility', 'intelligence', 'endurance', 'charisma', 'all'], default: null },
    },
});

export const Skill= new mongoose.model('Skill', skillSchema);