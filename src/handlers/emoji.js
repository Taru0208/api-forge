// Emoji utilities — search, lookup, extract, strip, replace
// No external dependencies — pure JS with embedded emoji database

const EMOJI_DB = [
  // === Smileys ===
  { emoji: '\u{1F600}', name: 'grinning_face', category: 'Smileys', aliases: ['happy', 'smile', 'grin'] },
  { emoji: '\u{1F601}', name: 'beaming_face', category: 'Smileys', aliases: ['grin', 'happy'] },
  { emoji: '\u{1F602}', name: 'face_with_tears_of_joy', category: 'Smileys', aliases: ['joy', 'lol', 'laugh', 'crying_laughing'] },
  { emoji: '\u{1F603}', name: 'grinning_face_with_big_eyes', category: 'Smileys', aliases: ['smiley', 'happy'] },
  { emoji: '\u{1F604}', name: 'grinning_face_with_smiling_eyes', category: 'Smileys', aliases: ['smile', 'happy'] },
  { emoji: '\u{1F605}', name: 'grinning_face_with_sweat', category: 'Smileys', aliases: ['sweat_smile'] },
  { emoji: '\u{1F606}', name: 'squinting_face_with_tongue', category: 'Smileys', aliases: ['laughing', 'satisfied'] },
  { emoji: '\u{1F609}', name: 'winking_face', category: 'Smileys', aliases: ['wink'] },
  { emoji: '\u{1F60A}', name: 'smiling_face_with_smiling_eyes', category: 'Smileys', aliases: ['blush'] },
  { emoji: '\u{1F60B}', name: 'face_savoring_food', category: 'Smileys', aliases: ['yum', 'delicious'] },
  { emoji: '\u{1F60C}', name: 'relieved_face', category: 'Smileys', aliases: ['relieved'] },
  { emoji: '\u{1F60D}', name: 'smiling_face_with_heart_eyes', category: 'Smileys', aliases: ['heart_eyes', 'love'] },
  { emoji: '\u{1F60E}', name: 'smiling_face_with_sunglasses', category: 'Smileys', aliases: ['cool', 'sunglasses'] },
  { emoji: '\u{1F60F}', name: 'smirking_face', category: 'Smileys', aliases: ['smirk'] },
  { emoji: '\u{1F610}', name: 'neutral_face', category: 'Smileys', aliases: ['neutral'] },
  { emoji: '\u{1F612}', name: 'unamused_face', category: 'Smileys', aliases: ['unamused'] },
  { emoji: '\u{1F614}', name: 'pensive_face', category: 'Smileys', aliases: ['pensive'] },
  { emoji: '\u{1F615}', name: 'confused_face', category: 'Smileys', aliases: ['confused'] },
  { emoji: '\u{1F616}', name: 'confounded_face', category: 'Smileys', aliases: ['confounded'] },
  { emoji: '\u{1F618}', name: 'face_blowing_a_kiss', category: 'Smileys', aliases: ['kissing_heart', 'kiss'] },
  { emoji: '\u{1F61B}', name: 'face_with_tongue', category: 'Smileys', aliases: ['tongue', 'stuck_out_tongue'] },
  { emoji: '\u{1F61C}', name: 'winking_face_with_tongue', category: 'Smileys', aliases: ['stuck_out_tongue_winking_eye'] },
  { emoji: '\u{1F61D}', name: 'squinting_face_with_tongue', category: 'Smileys', aliases: ['stuck_out_tongue_closed_eyes'] },
  { emoji: '\u{1F61E}', name: 'disappointed_face', category: 'Smileys', aliases: ['disappointed', 'sad'] },
  { emoji: '\u{1F620}', name: 'angry_face', category: 'Smileys', aliases: ['angry'] },
  { emoji: '\u{1F621}', name: 'pouting_face', category: 'Smileys', aliases: ['rage', 'pout'] },
  { emoji: '\u{1F622}', name: 'crying_face', category: 'Smileys', aliases: ['cry', 'sad'] },
  { emoji: '\u{1F623}', name: 'persevering_face', category: 'Smileys', aliases: ['persevere'] },
  { emoji: '\u{1F624}', name: 'face_with_steam_from_nose', category: 'Smileys', aliases: ['triumph'] },
  { emoji: '\u{1F625}', name: 'sad_but_relieved_face', category: 'Smileys', aliases: ['disappointed_relieved'] },
  { emoji: '\u{1F628}', name: 'fearful_face', category: 'Smileys', aliases: ['fearful', 'scared'] },
  { emoji: '\u{1F629}', name: 'weary_face', category: 'Smileys', aliases: ['weary'] },
  { emoji: '\u{1F62A}', name: 'sleepy_face', category: 'Smileys', aliases: ['sleepy'] },
  { emoji: '\u{1F62B}', name: 'tired_face', category: 'Smileys', aliases: ['tired'] },
  { emoji: '\u{1F62D}', name: 'loudly_crying_face', category: 'Smileys', aliases: ['sob', 'crying'] },
  { emoji: '\u{1F631}', name: 'face_screaming_in_fear', category: 'Smileys', aliases: ['scream'] },
  { emoji: '\u{1F632}', name: 'astonished_face', category: 'Smileys', aliases: ['astonished'] },
  { emoji: '\u{1F633}', name: 'flushed_face', category: 'Smileys', aliases: ['flushed'] },
  { emoji: '\u{1F634}', name: 'sleeping_face', category: 'Smileys', aliases: ['sleeping', 'zzz'] },
  { emoji: '\u{1F635}', name: 'face_with_crossed_out_eyes', category: 'Smileys', aliases: ['dizzy_face'] },
  { emoji: '\u{1F637}', name: 'face_with_medical_mask', category: 'Smileys', aliases: ['mask', 'sick'] },
  { emoji: '\u{1F641}', name: 'slightly_frowning_face', category: 'Smileys', aliases: ['frown', 'slight_frown'] },
  { emoji: '\u{1F642}', name: 'slightly_smiling_face', category: 'Smileys', aliases: ['slight_smile'] },
  { emoji: '\u{1F643}', name: 'upside_down_face', category: 'Smileys', aliases: ['upside_down'] },
  { emoji: '\u{1F644}', name: 'face_with_rolling_eyes', category: 'Smileys', aliases: ['rolling_eyes', 'eye_roll'] },
  { emoji: '\u{1F910}', name: 'zipper_mouth_face', category: 'Smileys', aliases: ['zipper_mouth'] },
  { emoji: '\u{1F911}', name: 'money_mouth_face', category: 'Smileys', aliases: ['money_mouth'] },
  { emoji: '\u{1F914}', name: 'thinking_face', category: 'Smileys', aliases: ['thinking', 'hmm'] },
  { emoji: '\u{1F917}', name: 'hugging_face', category: 'Smileys', aliases: ['hugs', 'hug'] },
  { emoji: '\u{1F921}', name: 'clown_face', category: 'Smileys', aliases: ['clown'] },
  { emoji: '\u{1F923}', name: 'rolling_on_the_floor_laughing', category: 'Smileys', aliases: ['rofl'] },
  { emoji: '\u{1F929}', name: 'star_struck', category: 'Smileys', aliases: ['star_eyes', 'starstruck'] },
  { emoji: '\u{1F970}', name: 'smiling_face_with_hearts', category: 'Smileys', aliases: ['hearts', 'in_love'] },
  { emoji: '\u{1F971}', name: 'yawning_face', category: 'Smileys', aliases: ['yawn'] },
  { emoji: '\u{1F973}', name: 'partying_face', category: 'Smileys', aliases: ['party'] },
  { emoji: '\u{1F975}', name: 'hot_face', category: 'Smileys', aliases: ['hot', 'sweating'] },
  { emoji: '\u{1F976}', name: 'cold_face', category: 'Smileys', aliases: ['cold', 'freezing'] },
  { emoji: '\u{1F978}', name: 'disguised_face', category: 'Smileys', aliases: ['disguise'] },
  { emoji: '\u{1F97A}', name: 'pleading_face', category: 'Smileys', aliases: ['pleading', 'puppy_eyes'] },

  // === People ===
  { emoji: '\u{1F44D}', name: 'thumbs_up', category: 'People', aliases: ['thumbsup', 'like', 'ok'] },
  { emoji: '\u{1F44E}', name: 'thumbs_down', category: 'People', aliases: ['thumbsdown', 'dislike'] },
  { emoji: '\u{1F44F}', name: 'clapping_hands', category: 'People', aliases: ['clap', 'applause'] },
  { emoji: '\u{1F44B}', name: 'waving_hand', category: 'People', aliases: ['wave', 'hello', 'bye'] },
  { emoji: '\u{1F44C}', name: 'ok_hand', category: 'People', aliases: ['ok', 'perfect'] },
  { emoji: '\u{270C}\u{FE0F}', name: 'victory_hand', category: 'People', aliases: ['peace', 'v'] },
  { emoji: '\u{1F91E}', name: 'crossed_fingers', category: 'People', aliases: ['fingers_crossed', 'luck'] },
  { emoji: '\u{1F91F}', name: 'love_you_gesture', category: 'People', aliases: ['ily'] },
  { emoji: '\u{1F918}', name: 'sign_of_the_horns', category: 'People', aliases: ['rock_on', 'metal'] },
  { emoji: '\u{1F919}', name: 'call_me_hand', category: 'People', aliases: ['call_me', 'shaka'] },
  { emoji: '\u{1F448}', name: 'backhand_index_pointing_left', category: 'People', aliases: ['point_left'] },
  { emoji: '\u{1F449}', name: 'backhand_index_pointing_right', category: 'People', aliases: ['point_right'] },
  { emoji: '\u{1F446}', name: 'backhand_index_pointing_up', category: 'People', aliases: ['point_up'] },
  { emoji: '\u{1F447}', name: 'backhand_index_pointing_down', category: 'People', aliases: ['point_down'] },
  { emoji: '\u{261D}\u{FE0F}', name: 'index_pointing_up', category: 'People', aliases: ['point_up_2'] },
  { emoji: '\u{1F64F}', name: 'folded_hands', category: 'People', aliases: ['pray', 'please', 'namaste'] },
  { emoji: '\u{1F4AA}', name: 'flexed_biceps', category: 'People', aliases: ['muscle', 'strong', 'flex'] },
  { emoji: '\u{1F91D}', name: 'handshake', category: 'People', aliases: ['shake', 'deal'] },
  { emoji: '\u{270D}\u{FE0F}', name: 'writing_hand', category: 'People', aliases: ['writing'] },
  { emoji: '\u{1F485}', name: 'nail_polish', category: 'People', aliases: ['nails'] },
  { emoji: '\u{1F933}', name: 'selfie', category: 'People', aliases: ['selfie'] },
  { emoji: '\u{1F466}', name: 'boy', category: 'People', aliases: ['boy'] },
  { emoji: '\u{1F467}', name: 'girl', category: 'People', aliases: ['girl'] },
  { emoji: '\u{1F468}', name: 'man', category: 'People', aliases: ['man'] },
  { emoji: '\u{1F469}', name: 'woman', category: 'People', aliases: ['woman'] },
  { emoji: '\u{1F476}', name: 'baby', category: 'People', aliases: ['baby', 'infant'] },
  { emoji: '\u{1F474}', name: 'old_man', category: 'People', aliases: ['grandpa', 'elder'] },
  { emoji: '\u{1F475}', name: 'old_woman', category: 'People', aliases: ['grandma', 'elder'] },

  // === Animals ===
  { emoji: '\u{1F436}', name: 'dog_face', category: 'Animals', aliases: ['dog', 'puppy'] },
  { emoji: '\u{1F431}', name: 'cat_face', category: 'Animals', aliases: ['cat', 'kitten'] },
  { emoji: '\u{1F42D}', name: 'mouse_face', category: 'Animals', aliases: ['mouse'] },
  { emoji: '\u{1F439}', name: 'hamster', category: 'Animals', aliases: ['hamster'] },
  { emoji: '\u{1F430}', name: 'rabbit_face', category: 'Animals', aliases: ['rabbit', 'bunny'] },
  { emoji: '\u{1F43B}', name: 'bear', category: 'Animals', aliases: ['bear'] },
  { emoji: '\u{1F43C}', name: 'panda', category: 'Animals', aliases: ['panda'] },
  { emoji: '\u{1F428}', name: 'koala', category: 'Animals', aliases: ['koala'] },
  { emoji: '\u{1F42F}', name: 'tiger_face', category: 'Animals', aliases: ['tiger'] },
  { emoji: '\u{1F981}', name: 'lion', category: 'Animals', aliases: ['lion', 'lion_face'] },
  { emoji: '\u{1F42E}', name: 'cow_face', category: 'Animals', aliases: ['cow'] },
  { emoji: '\u{1F437}', name: 'pig_face', category: 'Animals', aliases: ['pig'] },
  { emoji: '\u{1F438}', name: 'frog', category: 'Animals', aliases: ['frog'] },
  { emoji: '\u{1F435}', name: 'monkey_face', category: 'Animals', aliases: ['monkey'] },
  { emoji: '\u{1F414}', name: 'chicken', category: 'Animals', aliases: ['chicken'] },
  { emoji: '\u{1F427}', name: 'penguin', category: 'Animals', aliases: ['penguin'] },
  { emoji: '\u{1F426}', name: 'bird', category: 'Animals', aliases: ['bird'] },
  { emoji: '\u{1F985}', name: 'eagle', category: 'Animals', aliases: ['eagle'] },
  { emoji: '\u{1F40D}', name: 'snake', category: 'Animals', aliases: ['snake'] },
  { emoji: '\u{1F422}', name: 'turtle', category: 'Animals', aliases: ['turtle'] },
  { emoji: '\u{1F41B}', name: 'bug', category: 'Animals', aliases: ['bug', 'insect'] },
  { emoji: '\u{1F41D}', name: 'honeybee', category: 'Animals', aliases: ['bee'] },
  { emoji: '\u{1F98B}', name: 'butterfly', category: 'Animals', aliases: ['butterfly'] },
  { emoji: '\u{1F40C}', name: 'snail', category: 'Animals', aliases: ['snail'] },
  { emoji: '\u{1F419}', name: 'octopus', category: 'Animals', aliases: ['octopus'] },
  { emoji: '\u{1F420}', name: 'tropical_fish', category: 'Animals', aliases: ['fish'] },
  { emoji: '\u{1F433}', name: 'spouting_whale', category: 'Animals', aliases: ['whale'] },
  { emoji: '\u{1F42C}', name: 'dolphin', category: 'Animals', aliases: ['dolphin'] },
  { emoji: '\u{1F984}', name: 'unicorn', category: 'Animals', aliases: ['unicorn'] },

  // === Food ===
  { emoji: '\u{1F34E}', name: 'red_apple', category: 'Food', aliases: ['apple'] },
  { emoji: '\u{1F34C}', name: 'banana', category: 'Food', aliases: ['banana'] },
  { emoji: '\u{1F347}', name: 'grapes', category: 'Food', aliases: ['grapes'] },
  { emoji: '\u{1F353}', name: 'strawberry', category: 'Food', aliases: ['strawberry'] },
  { emoji: '\u{1F352}', name: 'cherries', category: 'Food', aliases: ['cherries', 'cherry'] },
  { emoji: '\u{1F351}', name: 'peach', category: 'Food', aliases: ['peach'] },
  { emoji: '\u{1F34A}', name: 'tangerine', category: 'Food', aliases: ['orange', 'mandarin'] },
  { emoji: '\u{1F349}', name: 'watermelon', category: 'Food', aliases: ['watermelon'] },
  { emoji: '\u{1F355}', name: 'pizza', category: 'Food', aliases: ['pizza'] },
  { emoji: '\u{1F354}', name: 'hamburger', category: 'Food', aliases: ['burger', 'hamburger'] },
  { emoji: '\u{1F35F}', name: 'french_fries', category: 'Food', aliases: ['fries'] },
  { emoji: '\u{1F32E}', name: 'taco', category: 'Food', aliases: ['taco'] },
  { emoji: '\u{1F363}', name: 'sushi', category: 'Food', aliases: ['sushi'] },
  { emoji: '\u{1F35C}', name: 'steaming_bowl', category: 'Food', aliases: ['ramen', 'noodles'] },
  { emoji: '\u{1F370}', name: 'shortcake', category: 'Food', aliases: ['cake'] },
  { emoji: '\u{1F36B}', name: 'chocolate_bar', category: 'Food', aliases: ['chocolate'] },
  { emoji: '\u{1F369}', name: 'doughnut', category: 'Food', aliases: ['donut'] },
  { emoji: '\u{1F36A}', name: 'cookie', category: 'Food', aliases: ['cookie'] },
  { emoji: '\u{1F37A}', name: 'beer_mug', category: 'Food', aliases: ['beer'] },
  { emoji: '\u{1F377}', name: 'wine_glass', category: 'Food', aliases: ['wine'] },
  { emoji: '\u{2615}', name: 'hot_beverage', category: 'Food', aliases: ['coffee', 'tea'] },
  { emoji: '\u{1F375}', name: 'teacup_without_handle', category: 'Food', aliases: ['tea', 'green_tea'] },
  { emoji: '\u{1F95B}', name: 'glass_of_milk', category: 'Food', aliases: ['milk'] },
  { emoji: '\u{1F35E}', name: 'bread', category: 'Food', aliases: ['bread'] },

  // === Travel ===
  { emoji: '\u{2708}\u{FE0F}', name: 'airplane', category: 'Travel', aliases: ['plane', 'flight'] },
  { emoji: '\u{1F697}', name: 'automobile', category: 'Travel', aliases: ['car'] },
  { emoji: '\u{1F695}', name: 'taxi', category: 'Travel', aliases: ['taxi', 'cab'] },
  { emoji: '\u{1F68C}', name: 'bus', category: 'Travel', aliases: ['bus'] },
  { emoji: '\u{1F682}', name: 'locomotive', category: 'Travel', aliases: ['train'] },
  { emoji: '\u{1F6A2}', name: 'ship', category: 'Travel', aliases: ['ship', 'cruise'] },
  { emoji: '\u{1F680}', name: 'rocket', category: 'Travel', aliases: ['rocket', 'launch'] },
  { emoji: '\u{1F3E0}', name: 'house', category: 'Travel', aliases: ['home', 'house'] },
  { emoji: '\u{1F3E2}', name: 'office_building', category: 'Travel', aliases: ['office'] },
  { emoji: '\u{1F3E5}', name: 'hospital', category: 'Travel', aliases: ['hospital'] },
  { emoji: '\u{1F3EB}', name: 'school', category: 'Travel', aliases: ['school'] },
  { emoji: '\u{1F3D6}\u{FE0F}', name: 'beach_with_umbrella', category: 'Travel', aliases: ['beach'] },
  { emoji: '\u{1F3D4}\u{FE0F}', name: 'snow_capped_mountain', category: 'Travel', aliases: ['mountain'] },
  { emoji: '\u{1F30D}', name: 'globe_showing_europe_africa', category: 'Travel', aliases: ['earth', 'globe'] },
  { emoji: '\u{1F30E}', name: 'globe_showing_americas', category: 'Travel', aliases: ['earth_americas'] },
  { emoji: '\u{1F30F}', name: 'globe_showing_asia_australia', category: 'Travel', aliases: ['earth_asia'] },
  { emoji: '\u{1F5FC}', name: 'tokyo_tower', category: 'Travel', aliases: ['tokyo_tower'] },
  { emoji: '\u{1F5FD}', name: 'statue_of_liberty', category: 'Travel', aliases: ['statue_of_liberty'] },
  { emoji: '\u{26F0}\u{FE0F}', name: 'mountain', category: 'Travel', aliases: ['mountain'] },

  // === Activities ===
  { emoji: '\u{26BD}', name: 'soccer_ball', category: 'Activities', aliases: ['soccer', 'football'] },
  { emoji: '\u{1F3C0}', name: 'basketball', category: 'Activities', aliases: ['basketball'] },
  { emoji: '\u{1F3C8}', name: 'american_football', category: 'Activities', aliases: ['football'] },
  { emoji: '\u{26BE}', name: 'baseball', category: 'Activities', aliases: ['baseball'] },
  { emoji: '\u{1F3BE}', name: 'tennis', category: 'Activities', aliases: ['tennis'] },
  { emoji: '\u{1F3D0}', name: 'volleyball', category: 'Activities', aliases: ['volleyball'] },
  { emoji: '\u{1F3B1}', name: 'pool_8_ball', category: 'Activities', aliases: ['billiards', 'pool'] },
  { emoji: '\u{1F3B3}', name: 'bowling', category: 'Activities', aliases: ['bowling'] },
  { emoji: '\u{1F3AF}', name: 'bullseye', category: 'Activities', aliases: ['dart', 'target'] },
  { emoji: '\u{1F3AE}', name: 'video_game', category: 'Activities', aliases: ['gaming', 'controller'] },
  { emoji: '\u{1F3B2}', name: 'game_die', category: 'Activities', aliases: ['dice'] },
  { emoji: '\u{265F}\u{FE0F}', name: 'chess_pawn', category: 'Activities', aliases: ['chess'] },
  { emoji: '\u{1F3B5}', name: 'musical_note', category: 'Activities', aliases: ['music', 'note'] },
  { emoji: '\u{1F3B6}', name: 'musical_notes', category: 'Activities', aliases: ['music', 'notes'] },
  { emoji: '\u{1F3A4}', name: 'microphone', category: 'Activities', aliases: ['mic', 'karaoke'] },
  { emoji: '\u{1F3A8}', name: 'artist_palette', category: 'Activities', aliases: ['art', 'painting'] },
  { emoji: '\u{1F3AC}', name: 'clapper_board', category: 'Activities', aliases: ['movie', 'film'] },
  { emoji: '\u{1F3AD}', name: 'performing_arts', category: 'Activities', aliases: ['theater', 'drama'] },
  { emoji: '\u{1F3C6}', name: 'trophy', category: 'Activities', aliases: ['trophy', 'winner'] },
  { emoji: '\u{1F3C5}', name: 'sports_medal', category: 'Activities', aliases: ['medal'] },

  // === Objects ===
  { emoji: '\u{1F4F1}', name: 'mobile_phone', category: 'Objects', aliases: ['phone', 'iphone'] },
  { emoji: '\u{1F4BB}', name: 'laptop', category: 'Objects', aliases: ['computer', 'laptop'] },
  { emoji: '\u{1F4F7}', name: 'camera', category: 'Objects', aliases: ['camera', 'photo'] },
  { emoji: '\u{1F4FA}', name: 'television', category: 'Objects', aliases: ['tv'] },
  { emoji: '\u{1F4FB}', name: 'radio', category: 'Objects', aliases: ['radio'] },
  { emoji: '\u{1F50B}', name: 'battery', category: 'Objects', aliases: ['battery'] },
  { emoji: '\u{1F50C}', name: 'electric_plug', category: 'Objects', aliases: ['plug', 'power'] },
  { emoji: '\u{1F4A1}', name: 'light_bulb', category: 'Objects', aliases: ['bulb', 'idea'] },
  { emoji: '\u{1F4D6}', name: 'open_book', category: 'Objects', aliases: ['book', 'read'] },
  { emoji: '\u{1F4DA}', name: 'books', category: 'Objects', aliases: ['library', 'books'] },
  { emoji: '\u{1F4DD}', name: 'memo', category: 'Objects', aliases: ['note', 'pencil'] },
  { emoji: '\u{270F}\u{FE0F}', name: 'pencil', category: 'Objects', aliases: ['pencil', 'edit'] },
  { emoji: '\u{1F4E7}', name: 'email', category: 'Objects', aliases: ['email', 'mail', 'envelope'] },
  { emoji: '\u{1F4E6}', name: 'package', category: 'Objects', aliases: ['box', 'parcel'] },
  { emoji: '\u{1F511}', name: 'key', category: 'Objects', aliases: ['key', 'password'] },
  { emoji: '\u{1F512}', name: 'locked', category: 'Objects', aliases: ['lock'] },
  { emoji: '\u{1F513}', name: 'unlocked', category: 'Objects', aliases: ['unlock'] },
  { emoji: '\u{1F528}', name: 'hammer', category: 'Objects', aliases: ['hammer', 'tool'] },
  { emoji: '\u{1F52A}', name: 'kitchen_knife', category: 'Objects', aliases: ['knife'] },
  { emoji: '\u{1F4B0}', name: 'money_bag', category: 'Objects', aliases: ['money', 'rich'] },
  { emoji: '\u{1F4B3}', name: 'credit_card', category: 'Objects', aliases: ['credit_card'] },
  { emoji: '\u{1F48E}', name: 'gem_stone', category: 'Objects', aliases: ['gem', 'diamond'] },
  { emoji: '\u{231A}', name: 'watch', category: 'Objects', aliases: ['watch', 'time'] },
  { emoji: '\u{23F0}', name: 'alarm_clock', category: 'Objects', aliases: ['alarm', 'clock'] },
  { emoji: '\u{1F4F0}', name: 'newspaper', category: 'Objects', aliases: ['news'] },

  // === Symbols ===
  { emoji: '\u{2764}\u{FE0F}', name: 'red_heart', category: 'Symbols', aliases: ['heart', 'love'] },
  { emoji: '\u{1F49C}', name: 'purple_heart', category: 'Symbols', aliases: ['purple_heart'] },
  { emoji: '\u{1F49A}', name: 'green_heart', category: 'Symbols', aliases: ['green_heart'] },
  { emoji: '\u{1F499}', name: 'blue_heart', category: 'Symbols', aliases: ['blue_heart'] },
  { emoji: '\u{1F49B}', name: 'yellow_heart', category: 'Symbols', aliases: ['yellow_heart'] },
  { emoji: '\u{1F5A4}', name: 'black_heart', category: 'Symbols', aliases: ['black_heart'] },
  { emoji: '\u{1F494}', name: 'broken_heart', category: 'Symbols', aliases: ['broken_heart', 'heartbreak'] },
  { emoji: '\u{1F495}', name: 'two_hearts', category: 'Symbols', aliases: ['two_hearts'] },
  { emoji: '\u{1F496}', name: 'sparkling_heart', category: 'Symbols', aliases: ['sparkling_heart'] },
  { emoji: '\u{1F497}', name: 'growing_heart', category: 'Symbols', aliases: ['growing_heart'] },
  { emoji: '\u{2B50}', name: 'star', category: 'Symbols', aliases: ['star'] },
  { emoji: '\u{1F31F}', name: 'glowing_star', category: 'Symbols', aliases: ['star2'] },
  { emoji: '\u{2728}', name: 'sparkles', category: 'Symbols', aliases: ['sparkle'] },
  { emoji: '\u{1F4A5}', name: 'collision', category: 'Symbols', aliases: ['boom', 'explosion'] },
  { emoji: '\u{1F525}', name: 'fire', category: 'Symbols', aliases: ['fire', 'hot', 'lit'] },
  { emoji: '\u{1F4AF}', name: 'hundred_points', category: 'Symbols', aliases: ['100', 'perfect'] },
  { emoji: '\u{2705}', name: 'check_mark_button', category: 'Symbols', aliases: ['check', 'done'] },
  { emoji: '\u{274C}', name: 'cross_mark', category: 'Symbols', aliases: ['x', 'wrong'] },
  { emoji: '\u{2757}', name: 'exclamation_mark', category: 'Symbols', aliases: ['exclamation', 'bang'] },
  { emoji: '\u{2753}', name: 'question_mark', category: 'Symbols', aliases: ['question'] },
  { emoji: '\u{267B}\u{FE0F}', name: 'recycling_symbol', category: 'Symbols', aliases: ['recycle'] },
  { emoji: '\u{1F6AB}', name: 'prohibited', category: 'Symbols', aliases: ['no', 'forbidden'] },
  { emoji: '\u{26A0}\u{FE0F}', name: 'warning', category: 'Symbols', aliases: ['warning', 'caution'] },
  { emoji: '\u{2139}\u{FE0F}', name: 'information', category: 'Symbols', aliases: ['info'] },
  { emoji: '\u{1F504}', name: 'counterclockwise_arrows_button', category: 'Symbols', aliases: ['refresh', 'reload'] },

  // === Flags ===
  { emoji: '\u{1F1FA}\u{1F1F8}', name: 'flag_united_states', category: 'Flags', aliases: ['us', 'usa', 'america'] },
  { emoji: '\u{1F1EC}\u{1F1E7}', name: 'flag_united_kingdom', category: 'Flags', aliases: ['uk', 'britain'] },
  { emoji: '\u{1F1E8}\u{1F1E6}', name: 'flag_canada', category: 'Flags', aliases: ['canada'] },
  { emoji: '\u{1F1EB}\u{1F1F7}', name: 'flag_france', category: 'Flags', aliases: ['france'] },
  { emoji: '\u{1F1E9}\u{1F1EA}', name: 'flag_germany', category: 'Flags', aliases: ['germany'] },
  { emoji: '\u{1F1EE}\u{1F1F9}', name: 'flag_italy', category: 'Flags', aliases: ['italy'] },
  { emoji: '\u{1F1EA}\u{1F1F8}', name: 'flag_spain', category: 'Flags', aliases: ['spain'] },
  { emoji: '\u{1F1F5}\u{1F1F9}', name: 'flag_portugal', category: 'Flags', aliases: ['portugal'] },
  { emoji: '\u{1F1E7}\u{1F1F7}', name: 'flag_brazil', category: 'Flags', aliases: ['brazil'] },
  { emoji: '\u{1F1F2}\u{1F1FD}', name: 'flag_mexico', category: 'Flags', aliases: ['mexico'] },
  { emoji: '\u{1F1EF}\u{1F1F5}', name: 'flag_japan', category: 'Flags', aliases: ['japan'] },
  { emoji: '\u{1F1F0}\u{1F1F7}', name: 'flag_south_korea', category: 'Flags', aliases: ['korea', 'south_korea'] },
  { emoji: '\u{1F1E8}\u{1F1F3}', name: 'flag_china', category: 'Flags', aliases: ['china'] },
  { emoji: '\u{1F1EE}\u{1F1F3}', name: 'flag_india', category: 'Flags', aliases: ['india'] },
  { emoji: '\u{1F1F7}\u{1F1FA}', name: 'flag_russia', category: 'Flags', aliases: ['russia'] },
  { emoji: '\u{1F1E6}\u{1F1FA}', name: 'flag_australia', category: 'Flags', aliases: ['australia'] },
  { emoji: '\u{1F1F3}\u{1F1FF}', name: 'flag_new_zealand', category: 'Flags', aliases: ['new_zealand'] },
  { emoji: '\u{1F1F8}\u{1F1EA}', name: 'flag_sweden', category: 'Flags', aliases: ['sweden'] },
  { emoji: '\u{1F1F3}\u{1F1F4}', name: 'flag_norway', category: 'Flags', aliases: ['norway'] },
  { emoji: '\u{1F1E8}\u{1F1ED}', name: 'flag_switzerland', category: 'Flags', aliases: ['switzerland'] },
  { emoji: '\u{1F1F3}\u{1F1EC}', name: 'flag_nigeria', category: 'Flags', aliases: ['nigeria'] },
  { emoji: '\u{1F1FF}\u{1F1E6}', name: 'flag_south_africa', category: 'Flags', aliases: ['south_africa'] },
  { emoji: '\u{1F1EA}\u{1F1EC}', name: 'flag_egypt', category: 'Flags', aliases: ['egypt'] },
  { emoji: '\u{1F1E6}\u{1F1F7}', name: 'flag_argentina', category: 'Flags', aliases: ['argentina'] },
  { emoji: '\u{1F1F9}\u{1F1F7}', name: 'flag_turkey', category: 'Flags', aliases: ['turkey'] },
  { emoji: '\u{1F1F8}\u{1F1E6}', name: 'flag_saudi_arabia', category: 'Flags', aliases: ['saudi_arabia'] },
  { emoji: '\u{1F1F9}\u{1F1ED}', name: 'flag_thailand', category: 'Flags', aliases: ['thailand'] },
  { emoji: '\u{1F1FB}\u{1F1F3}', name: 'flag_vietnam', category: 'Flags', aliases: ['vietnam'] },
  { emoji: '\u{1F1EE}\u{1F1E9}', name: 'flag_indonesia', category: 'Flags', aliases: ['indonesia'] },
  { emoji: '\u{1F1F5}\u{1F1ED}', name: 'flag_philippines', category: 'Flags', aliases: ['philippines'] },
];

// Build indexes for fast lookups
const nameIndex = new Map();
const emojiIndex = new Map();
for (const entry of EMOJI_DB) {
  nameIndex.set(entry.name.toLowerCase(), entry);
  emojiIndex.set(entry.emoji, entry);
}

// Emoji regex: covers most common emoji ranges
// Regional indicators (flags), emoticons, symbols, dingbats, supplemental symbols, etc.
const EMOJI_REGEX = /(?:\u{1F1E6}[\u{1F1E8}-\u{1F1FF}]|\u{1F1E7}[\u{1F1E6}\u{1F1E7}\u{1F1E9}-\u{1F1EF}\u{1F1F1}-\u{1F1F4}\u{1F1F6}-\u{1F1F9}\u{1F1FB}\u{1F1FC}\u{1F1FE}\u{1F1FF}]|\u{1F1E8}[\u{1F1E6}\u{1F1E8}\u{1F1E9}\u{1F1EB}-\u{1F1EE}\u{1F1F0}-\u{1F1F5}\u{1F1F7}\u{1F1FA}-\u{1F1FF}]|\u{1F1E9}[\u{1F1EA}\u{1F1EC}\u{1F1EF}\u{1F1F0}\u{1F1F2}\u{1F1F4}\u{1F1FF}]|\u{1F1EA}[\u{1F1E6}\u{1F1E8}\u{1F1EA}\u{1F1EC}\u{1F1ED}\u{1F1F7}-\u{1F1FA}]|\u{1F1EB}[\u{1F1EE}-\u{1F1F0}\u{1F1F2}\u{1F1F4}\u{1F1F7}]|\u{1F1EC}[\u{1F1E6}\u{1F1E7}\u{1F1E9}-\u{1F1EE}\u{1F1F1}-\u{1F1F3}\u{1F1F5}-\u{1F1FA}\u{1F1FC}\u{1F1FE}]|\u{1F1ED}[\u{1F1F0}\u{1F1F2}\u{1F1F3}\u{1F1F7}\u{1F1F9}\u{1F1FA}]|\u{1F1EE}[\u{1F1E8}-\u{1F1EA}\u{1F1F1}-\u{1F1F4}\u{1F1F6}-\u{1F1F9}]|\u{1F1EF}[\u{1F1EA}\u{1F1F2}\u{1F1F4}\u{1F1F5}]|\u{1F1F0}[\u{1F1EA}\u{1F1EC}-\u{1F1EE}\u{1F1F2}\u{1F1F3}\u{1F1F5}\u{1F1F7}\u{1F1FC}\u{1F1FE}\u{1F1FF}]|\u{1F1F1}[\u{1F1E6}-\u{1F1E8}\u{1F1EE}\u{1F1F0}\u{1F1F7}-\u{1F1FB}\u{1F1FE}]|\u{1F1F2}[\u{1F1E6}\u{1F1E8}-\u{1F1ED}\u{1F1F0}-\u{1F1FF}]|\u{1F1F3}[\u{1F1E6}\u{1F1E8}\u{1F1EA}-\u{1F1EC}\u{1F1EE}\u{1F1F1}\u{1F1F4}\u{1F1F5}\u{1F1F7}\u{1F1FA}\u{1F1FF}]|\u{1F1F4}\u{1F1F2}|\u{1F1F5}[\u{1F1E6}\u{1F1EA}-\u{1F1ED}\u{1F1F0}-\u{1F1F3}\u{1F1F7}-\u{1F1F9}\u{1F1FC}\u{1F1FE}]|\u{1F1F6}\u{1F1E6}|\u{1F1F7}[\u{1F1EA}\u{1F1F4}\u{1F1FA}\u{1F1FC}]|\u{1F1F8}[\u{1F1E6}-\u{1F1EA}\u{1F1EC}-\u{1F1F4}\u{1F1F7}-\u{1F1F9}\u{1F1FB}\u{1F1FD}-\u{1F1FF}]|\u{1F1F9}[\u{1F1E6}\u{1F1E8}\u{1F1E9}\u{1F1EB}-\u{1F1ED}\u{1F1EF}-\u{1F1F4}\u{1F1F7}\u{1F1F9}\u{1F1FB}\u{1F1FC}\u{1F1FF}]|\u{1F1FA}[\u{1F1E6}\u{1F1EC}\u{1F1F2}\u{1F1F3}\u{1F1F8}\u{1F1FE}\u{1F1FF}]|\u{1F1FB}[\u{1F1E6}\u{1F1E8}\u{1F1EA}\u{1F1EC}\u{1F1EE}\u{1F1F3}\u{1F1FA}]|\u{1F1FC}[\u{1F1EB}\u{1F1F8}]|\u{1F1FD}\u{1F1F0}|\u{1F1FE}[\u{1F1EA}\u{1F1F9}]|\u{1F1FF}[\u{1F1E6}\u{1F1F2}\u{1F1FC}]|[\u{231A}\u{231B}\u{23E9}-\u{23F3}\u{23F8}-\u{23FA}\u{25AA}\u{25AB}\u{25B6}\u{25C0}\u{25FB}-\u{25FE}\u{2600}-\u{2604}\u{260E}\u{2611}\u{2614}\u{2615}\u{2618}\u{261D}\u{2620}\u{2622}\u{2623}\u{2626}\u{262A}\u{262E}\u{262F}\u{2638}-\u{263A}\u{2640}\u{2642}\u{2648}-\u{2653}\u{265F}\u{2660}\u{2663}\u{2665}\u{2666}\u{2668}\u{267B}\u{267E}\u{267F}\u{2692}-\u{2697}\u{2699}\u{269B}\u{269C}\u{26A0}\u{26A1}\u{26A7}\u{26AA}\u{26AB}\u{26B0}\u{26B1}\u{26BD}\u{26BE}\u{26C4}\u{26C5}\u{26C8}\u{26CE}\u{26CF}\u{26D1}\u{26D3}\u{26D4}\u{26E9}\u{26EA}\u{26F0}-\u{26F5}\u{26F7}-\u{26FA}\u{26FD}\u{2702}\u{2705}\u{2708}-\u{270D}\u{270F}\u{2712}\u{2714}\u{2716}\u{271D}\u{2721}\u{2728}\u{2733}\u{2734}\u{2744}\u{2747}\u{274C}\u{274E}\u{2753}-\u{2755}\u{2757}\u{2763}\u{2764}\u{2795}-\u{2797}\u{27A1}\u{27B0}\u{27BF}\u{2934}\u{2935}\u{2B05}-\u{2B07}\u{2B1B}\u{2B1C}\u{2B50}\u{2B55}\u{3030}\u{303D}\u{3297}\u{3299}]|\u{FE0F}|[\u{1F004}\u{1F0CF}\u{1F170}\u{1F171}\u{1F17E}\u{1F17F}\u{1F18E}\u{1F191}-\u{1F19A}\u{1F1E0}-\u{1F1FF}\u{1F201}\u{1F202}\u{1F21A}\u{1F22F}\u{1F232}-\u{1F23A}\u{1F250}\u{1F251}\u{1F300}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}])/gu;

/**
 * Search emoji by name/keyword substring.
 * @param {string} query - Search query
 * @returns {{ results: Array<{emoji, name, category, aliases}>, count: number }}
 */
export function searchEmoji(query) {
  if (!query || typeof query !== 'string') {
    throw new Error('query is required');
  }

  const q = query.toLowerCase().trim();
  if (q.length === 0) {
    throw new Error('query cannot be empty');
  }

  const results = EMOJI_DB.filter(entry => {
    if (entry.name.toLowerCase().includes(q)) return true;
    if (entry.category.toLowerCase().includes(q)) return true;
    if (entry.aliases.some(a => a.toLowerCase().includes(q))) return true;
    return false;
  }).map(({ emoji, name, category, aliases }) => ({ emoji, name, category, aliases }));

  return { results, count: results.length };
}

/**
 * Exact lookup by name (case insensitive).
 * @param {string} name - Emoji name (e.g., "smile", "heart", "thumbs_up")
 * @returns {{ emoji, name, category, aliases } | null}
 */
export function getEmoji(name) {
  if (!name || typeof name !== 'string') {
    throw new Error('name is required');
  }

  const key = name.toLowerCase().trim();
  const entry = nameIndex.get(key);
  if (entry) {
    return { emoji: entry.emoji, name: entry.name, category: entry.category, aliases: entry.aliases };
  }

  // Also search aliases
  for (const e of EMOJI_DB) {
    if (e.aliases.some(a => a.toLowerCase() === key)) {
      return { emoji: e.emoji, name: e.name, category: e.category, aliases: e.aliases };
    }
  }

  return null;
}

/**
 * Return a random emoji, optionally filtered by category.
 * @param {string} [category] - Optional category filter
 * @returns {{ emoji, name, category, aliases }}
 */
export function randomEmoji(category) {
  let pool = EMOJI_DB;

  if (category && typeof category === 'string') {
    const cat = category.trim();
    pool = EMOJI_DB.filter(e => e.category.toLowerCase() === cat.toLowerCase());
    if (pool.length === 0) {
      throw new Error(`Unknown category: ${cat}. Available: ${[...new Set(EMOJI_DB.map(e => e.category))].join(', ')}`);
    }
  }

  const entry = pool[Math.floor(Math.random() * pool.length)];
  return { emoji: entry.emoji, name: entry.name, category: entry.category, aliases: entry.aliases };
}

/**
 * Given an emoji character, return its info.
 * @param {string} emoji - Emoji character (e.g., "\u{1F600}")
 * @returns {{ emoji, name, category, aliases, codepoints: string[] } | null}
 */
export function emojiInfo(emoji) {
  if (!emoji || typeof emoji !== 'string') {
    throw new Error('emoji is required');
  }

  const trimmed = emoji.trim();

  // Direct lookup
  const entry = emojiIndex.get(trimmed);
  if (entry) {
    const codepoints = [...trimmed].map(ch => 'U+' + ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0'));
    return {
      emoji: entry.emoji,
      name: entry.name,
      category: entry.category,
      aliases: entry.aliases,
      codepoints,
    };
  }

  // Try stripping variation selector (FE0F) for lookup
  const stripped = trimmed.replace(/\uFE0F/g, '');
  const entry2 = emojiIndex.get(stripped);
  if (entry2) {
    const codepoints = [...trimmed].map(ch => 'U+' + ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0'));
    return {
      emoji: entry2.emoji,
      name: entry2.name,
      category: entry2.category,
      aliases: entry2.aliases,
      codepoints,
    };
  }

  // Try adding variation selector for lookup
  const withVS = trimmed + '\uFE0F';
  const entry3 = emojiIndex.get(withVS);
  if (entry3) {
    const codepoints = [...trimmed].map(ch => 'U+' + ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0'));
    return {
      emoji: entry3.emoji,
      name: entry3.name,
      category: entry3.category,
      aliases: entry3.aliases,
      codepoints,
    };
  }

  return null;
}

/**
 * Return all categories with count of emojis in each.
 * @returns {{ categories: Array<{ name: string, count: number }>, total: number }}
 */
export function listCategories() {
  const counts = {};
  for (const entry of EMOJI_DB) {
    counts[entry.category] = (counts[entry.category] || 0) + 1;
  }

  const categories = Object.entries(counts).map(([name, count]) => ({ name, count }));
  return { categories, total: EMOJI_DB.length };
}

/**
 * Remove all emoji characters from text.
 * @param {string} text - Input text
 * @returns {{ cleaned: string, removed: number }}
 */
export function stripEmoji(text) {
  if (typeof text !== 'string') {
    throw new Error('text is required');
  }

  let removed = 0;
  const cleaned = text.replace(EMOJI_REGEX, () => {
    removed++;
    return '';
  });

  // Clean up leftover variation selectors
  const finalCleaned = cleaned.replace(/\uFE0F/g, '');

  return { cleaned: finalCleaned, removed };
}

/**
 * Extract all emoji characters from text with positions.
 * @param {string} text - Input text
 * @returns {{ emojis: Array<{ emoji: string, position: number }>, count: number }}
 */
export function extractEmojis(text) {
  if (typeof text !== 'string') {
    throw new Error('text is required');
  }

  const emojis = [];
  let match;
  // Reset lastIndex in case
  const regex = new RegExp(EMOJI_REGEX.source, 'gu');
  while ((match = regex.exec(text)) !== null) {
    // Skip standalone variation selectors
    if (match[0] === '\uFE0F') continue;
    emojis.push({ emoji: match[0], position: match.index });
  }

  return { emojis, count: emojis.length };
}

/**
 * Replace all emojis in text with a replacement string.
 * @param {string} text - Input text
 * @param {string} [replacement=''] - Replacement string
 * @returns {{ result: string, replacements: number }}
 */
export function replaceEmoji(text, replacement = '') {
  if (typeof text !== 'string') {
    throw new Error('text is required');
  }

  let replacements = 0;
  const result = text.replace(EMOJI_REGEX, (match) => {
    // Skip standalone variation selectors
    if (match === '\uFE0F') return '';
    replacements++;
    return replacement;
  });

  // Clean up leftover variation selectors
  const finalResult = result.replace(/\uFE0F/g, '');

  return { result: finalResult, replacements };
}
