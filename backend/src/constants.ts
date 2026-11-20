export const YARGSPY = {
	Instrument: {
		// Instruments are reserved in multiples of 10
		// 0-9: 5-fret guitar
		FiveFretGuitar: 0,
		FiveFretBass: 1,
		FiveFretRhythm: 2,
		FiveFretCoopGuitar: 3,
		Keys: 4,
		// 10-19: 6-fret guitar
		SixFretGuitar: 10,
		SixFretBass: 11,
		SixFretRhythm: 12,
		SixFretCoopGuitar: 13,
		// 20-29: Drums
		FourLaneDrums: 20,
		ProDrums: 21,
		FiveLaneDrums: 22,
		EliteDrums: 23,
		// 30-39: Pro instruments
		ProGuitar_17Fret: 30,
		ProGuitar_22Fret: 31,
		ProBass_17Fret: 32,
		ProBass_22Fret: 33,
		ProKeys: 34,
		// 40-49: Vocals
		Vocals: 40,
		Harmony: 41,
		// 50-59: DJ
		// DjSingle: 50,
		// DjDouble: 51,
		Band: 255, // byte.MaxValue
	},
	GameMode: {
		// Game modes are reserved in multiples of 5
		// 0-4: Guitar
		FiveFretGuitar: 0,
		SixFretGuitar: 1,

		// 5-9: Drums
		FourLaneDrums: 5,
		FiveLaneDrums: 6,
		// EliteDrums = 7,

		// 10-14: Pro instruments
		ProGuitar: 10,
		ProKeys: 11,

		// 15-19: Vocals
		Vocals: 15,

		// 20-24: Other
		// Dj = 20,
	},
	Difficulty: {
		Beginner: 0,
		Easy: 1,
		Medium: 2,
		Hard: 3,
		Expert: 4,
		ExpertPlus: 5,
	},
	Modifier: {
		AllStrums: 0,
		AllHopos: 1,
		AllTaps: 2,
		HoposToTaps: 3,
		TapsToHopos: 4,
		NoteShuffle: 5,
		NoKicks: 6,
		UnpitchedOnly: 7,
		NoDynamics: 8,
		NoVocalPercussion: 9,
		RangeCompress: 10,
	},
	Engine: {
		Default: 0,
		Casual: 1,
		Precision: 2,
	},
	GameVersion: {
		v0_13_1: 0,
		v0_13_2: 1,
		v0_14: 2,
		v0_15: 3,
	},
	AdminLogAction: {
		UserBan: 0,
		UserUnban: 1,
		SongAdd: 2,
		SongUpdate: 3,
		SongDelete: 4,
		ScoreDelete: 5,
		UserUpdate: 6,
	},
	EmailTokenPurpose: {
		Verify: 0,
		Reset: 1,
	},
	UserResolver: {
		ID: 0,
		Username: 1,
		Email: 2,
	},
} as const
