import mongoose, { Schema, Document } from 'mongoose';

export type SocialQuality = 'isolated' | 'neutral' | 'connected';
export type MoodTriggerCategory =
  | 'work'
  | 'relationships'
  | 'health'
  | 'finances'
  | 'environment'
  | 'random';

export interface IMoodLog extends Document {
  user: mongoose.Types.ObjectId;
  mood: string;
  specificEmotion?: string;
  intensity: number;
  energyLevel: number;
  stressLevel?: number; // 1-10, distinct from intensity
  anxietyLevel?: number; // 1-10, orthogonal to mood valence
  tagsPeople: string[];
  tagsPlaces: string[];
  tagsEvents: string[];
  socialQuality?: SocialQuality; // quality of social contact that day
  moodTriggerCategory?: MoodTriggerCategory;
  sleepHours: number;
  sleepQuality: number;
  exercise: boolean;
  exerciseMinutes?: number; // replaces the binary with actual duration
  notes?: string;
  reflections?: string;
  aiAnalysis?: string;
  date: Date;
}

const moodLogSchema: Schema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    mood: { type: String, required: true },
    specificEmotion: { type: String },
    intensity: { type: Number, required: true, min: 1, max: 10 },
    energyLevel: { type: Number, required: true, min: 1, max: 10 },
    tagsPeople: { type: [String], default: [] },
    tagsPlaces: { type: [String], default: [] },
    tagsEvents: { type: [String], default: [] },
    sleepHours: { type: Number, required: true, min: 0, max: 24 },
    sleepQuality: { type: Number, required: true, min: 1, max: 5 },
    stressLevel: { type: Number, min: 1, max: 10 },
    anxietyLevel: { type: Number, min: 1, max: 10 },
    socialQuality: { type: String, enum: ['isolated', 'neutral', 'connected'] },
    moodTriggerCategory: {
      type: String,
      enum: ['work', 'relationships', 'health', 'finances', 'environment', 'random'],
    },
    exercise: { type: Boolean, default: false },
    exerciseMinutes: { type: Number, min: 0 },
    notes: { type: String },
    reflections: { type: String },
    aiAnalysis: { type: String },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

// Index for faster queries
moodLogSchema.index({ user: 1, date: -1 });

const MoodLog = mongoose.model<IMoodLog>('MoodLog', moodLogSchema);

export default MoodLog;
