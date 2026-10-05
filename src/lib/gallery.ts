/* The photo archive, one entry per photograph, grouped by year newest first.
 *
 * Source: a folder of photos gathered from attendees and Flickr. Years come
 * from three places, in order of confidence: the filename for 2014–2017
 * (YEAR_handle_slug), the camera's own date for the 2008 set, and for the
 * Flickr batches either what is in the frame (the 2007 banner reads "June
 * 15–16, 2007"; the 2008 room carries the CBIC sign) or, for 2009 and 2011,
 * only when the batch was uploaded. 2026 is dated by the phone's own
 * timestamps: Pitch Night on Friday, sessions on Saturday. Move a file to
 * another year's folder if one of those turns out wrong; nothing else needs
 * to change.
 *
 * Credits are what the files tell us and no more. The 2014–2017 photos carry
 * the photographer's handle in their name; the Flickr batches carry no owner
 * or licence, so they are credited to the community until someone claims them.
 *
 * Every file under assets/gallery must have alt text below, and every alt
 * text must have a file: the build fails on either kind of mismatch. */
import type { ImageMetadata } from 'astro';

const files = import.meta.glob<{ default: ImageMetadata }>('../assets/gallery/*/*.jpg', {
  eager: true,
});

/* Keyed by "<year>/<filename without .jpg>". */
const ALT: Record<string, string> = {
  /* 2026: the UVA School of Data Science. Pitch Night on Friday (an
     organizer's selfies with each pitcher), sessions on Saturday. */
  '2026/img-0644': "A speaker at the lectern beside the screen reading 'beCamp Charlottesville 20th Anniversary'",
  '2026/img-0645': "An organizer's selfie with a pitcher in a green beCamp T-shirt speaking at the lectern",
  '2026/img-0646': "An organizer's selfie from the lectern, the Pitch Night crowd filling the room behind",
  '2026/img-0647': 'An organizer pulling a face in a selfie with a pitcher at the microphone',
  '2026/img-0648': "An organizer's selfie with a smiling pitcher in a cap waving to the room",
  '2026/img-0649': "An organizer's selfie with a pitcher in a beCamp 2018 T-shirt, mid-gesture at the microphone",
  '2026/img-0650': "An organizer's selfie with a pitcher in a green T-shirt holding the microphone",
  '2026/img-0651': "An organizer's selfie with a pitcher in a cap and grey hoodie holding the microphone",
  '2026/img-0652': 'The Pitch Night audience in rows of orange chairs, seen from the lectern',
  '2026/img-0654': "An organizer's selfie from the lectern, the Pitch Night audience behind",
  '2026/img-0718': 'The pitch board: rows of handwritten beCamp pitch cards taped to a window, each marked with vote tallies',
  '2026/img-0719': 'Another section of the pitch board, handwritten pitch cards with tally-mark votes',
  '2026/img-0720': 'Pitch cards with vote tallies arranged in rows on a white board',
  '2026/img-0721': 'A session in a lecture room, a presenter at the front between two projected screens of text',
  '2026/img-0722': 'A lecture room session seen from the side, attendees in blue chairs facing the projected screens',
  '2026/img-0723': 'Attendees at desks watching a presenter in a lecture room, a coffee cup in the foreground',
  '2026/img-0724': 'A presenter at the lectern beside the title slide "Proof of Thought"',
  '2026/img-0725': 'Attendees raising their hands during a session in a lecture room',
  '2026/img-0726': 'A young attendee wiring electronics into a green robot chassis beside a laptop',
  '2026/img-0727': 'Two attendees assembling small electronics kits on a sofa',
  '2026/img-0728': 'Attendees at a long table playing a robot board game on illustrated grid mats',
  '2026/img-0729': 'An adult and a child building a small robot together at a table covered in parts',
  '2026/img-0730': 'Attendees around a robot game mat, coding pieces scattered across the table',
  '2026/img-0731': 'The retrospective: attendees in a circle of chairs beneath screens asking "What should beCamp keep, change, and try?"',
  '2026/img-0732': 'A presenter gesturing beside a slide titled "A Harmful Prompt Goes Through the Same Weights"',
  '2026/img-0733': "An organizer gesturing at the day's session board on the main hall's video wall",
  '2026/img-0735': 'A lightning talk in the main hall, the video wall showing the lightning-talk timer',
  '2026/img-0736': 'A speaker at the lectern in the main hall during lightning talks',
  '2026/img-0737': 'Two speakers giving a lightning talk in front of the video wall timer',
  '2026/img-0738': 'A lightning talk speaker under the video wall reading "Want to talk? Line up to the right of the screen"',
  '2026/img-0739': 'A small session around a long table, seen through a glass wall',
  '2026/img-0741': "The full main hall seen from the side, the video wall showing beCamp's 20th anniversary logo",
  '2026/img-0742': 'The main hall during the welcome, the screen reading "Twenty years of showing up"',
  '2026/img-0743': 'A packed hall, attendees standing at the back while the voting rules show on screen',
  '2026/img-0744': 'Attendees writing on and reading the pitch board during voting',
  '2026/img-0745': 'The pitch board: rows of handwritten pitch cards on a dark wall',
  '2026/img-0746': 'The registration table under the School of Data Science sign, a beCamp welcome banner in front',
  '2026/img-0747': 'A wide lecture room with attendees at scattered tables during a session',
  '2026/img-0748': 'A discussion circle in a bright room with floor-to-ceiling windows and a wall of binary code',
  '2026/img-0749': 'Attendees around a long wooden table in a conference room during a discussion',
  '2026/img-0750': 'A presenter standing at the front of a lecture room, attendees in blue chairs around tables',
  '2026/img-0751': 'A presenter beside a projected diagram at the front of a lecture room, attendees listening',
  '2026/img-0752': 'A session in the main hall, a large historic city map filling the video wall',
  '2026/img-0753': 'A presenter beside a slide quoting "Internet and democracy — not two things, but one and the same thing in Taiwan"',
  '2026/img-4155': "The empty stage before doors, the screen reading 'beCamp Charlottesville 20th Anniversary' over rows of orange chairs",
  '2026/img-4931': "A speaker at the lectern beside a bar chart on the main hall's video wall, attendees in orange chairs",
  '2026/img-shared': 'A remote speaker on the giant video wall, presenting to a packed hall',

  /* 2007: a Tudor-style lodge with a stage, a band and a bar room. */
  '2007/flickr-3035585500': 'Three panelists on stools on stage under the beCamp June 15–16, 2007 banner, one speaking into a microphone',
  '2007/flickr-559590676': 'The beCamp 2007 banner on a glass door, sponsor logos beneath the June 15–16 dates',
  '2007/flickr-559590870': 'A small session in a lounge, attendees on sofas and armchairs facing a projector screen',
  '2007/flickr-559591072': 'Two attendees talking over lunch, a can of Dr Pepper on the table between them',
  '2007/flickr-559591170': 'A group talking around a table by the window, a laptop open and beer bottles beside it',
  '2007/flickr-559591598': 'A session in the main hall, attendees in wooden chairs near a screen showing the beCamp logo',
  '2007/flickr-559591654': 'A presenter beside a flip chart of handwritten notes, talking to the people seated in front',
  '2007/flickr-559591748': 'A dim session room lined with windows, attendees in a loose circle around a flip chart',
  '2007/flickr-559591824': 'Attendees seated in a circle in a windowed room under a beCamp banner',
  '2007/flickr-559592120': 'A crowd standing in the main hall, the beCamp logo glowing on the screen beyond them',
  '2007/flickr-559592198': 'A packed crowd standing shoulder to shoulder in the wood-panelled hall',
  '2007/flickr-559592304': 'Attendees gathered around the session board, coffee cups in hand',
  '2007/flickr-559592382': 'Attendees standing in a group in the hall, talking with drinks in hand',
  '2007/flickr-559592444': 'The empty stage at night, the beCamp June 15–16, 2007 logo lit in blue',
  '2007/flickr-559592544': 'The evening band on stage: banjo, acoustic guitar, drums and electric guitar',
  '2007/flickr-559592968': 'Attendees watching a projected slide of cartoon characters in the darkened hall',
  '2007/flickr-559593188': 'A blurred figure hurrying past people watching a projected screen in the dark',
  '2007/flickr-559593442': 'The band on stage with an accordion, guitar and bass in front of the beCamp banner',
  '2007/flickr-559593504': 'Two attendees at bar tables with beers and red cups',
  '2007/flickr-559593686': 'A speaker with a microphone beside a table lamp, a video camera filming in the foreground',
  '2007/flickr-559594238': 'An attendee laughing as another gestures mid-story in the hall',
  '2007/flickr-559594524': 'Attendees laughing in front of the beTech beCamp banner, one stretching both arms overhead',
  '2007/flickr-559594618': 'People crossing a checkered floor between flip charts, a box fan in the foreground',
  '2007/flickr-559594744': 'The hall at night under strings of lights, attendees at small tables',
  '2007/flickr-559594926': "The venue's Tudor-style entrance with the beCamp banner hung over the doors",
  '2007/flickr-559595038': 'A long trough of ice packed with canned drinks',
  '2007/flickr-559965051': 'An attendee typing on a laptop at a table by the window',
  '2007/flickr-559965993': 'Attendees talking around a table, one in a Ben Folds Five T-shirt working on a laptop',
  '2007/flickr-559966915': 'An attendee working on a laptop alone in a dark booth',
  '2007/flickr-559967811': 'The band on stage — banjo, fiddle, vocals and bass — in front of the beCamp banner',
  '2007/flickr-559968069': 'A singer at the microphone with a guitarist behind on stage',
  '2007/flickr-559968365': 'A drummer and a bass player on stage in front of the beCamp banner',
  '2007/flickr-559968597': 'The hall from the back during the evening set, the band on stage and a screen to the right',
  '2007/flickr-559969791': 'Attendees mingling between flip charts and tables in the hall',
  '2007/flickr-560378382': 'The beCamp 2007 group photo: about forty attendees outside the venue under the banner',
  '2007/flickr-560411410': 'A second take of the 2007 group photo outside the venue entrance',
  '2007/flickr-571583240': 'A speaker in a cap on a stool with a microphone, in front of the beTech beCamp banner',
  '2007/flickr-571584586': 'A flip chart of session ideas: Rails, Facebook Platform, AJAX, SMS gateways',
  '2007/flickr-571585758': 'A flip chart of session topics in red marker: Ruby on Rails, JRuby, application security, agile methodologies',
  '2007/flickr-571590126': 'Four attendees in close conversation in the dim hall',
  '2007/flickr-571591192': 'The band on stage with accordion, guitar, drums and bass',
  '2007/flickr-572108337': 'Three panelists seated in front of the beCamp banner, one speaking into a microphone',
  '2007/flickr-572116769': 'An attendee in a RailsConf 2007 shirt reading a flip chart of proposed topics',
  '2007/flickr-572118513': 'A speaker with a microphone in the dark beside a projected web page',
  '2007/flickr-572120301': 'A speaker with a microphone addressing attendees at tables, lit by a single lamp',
  '2007/flickr-572140521': 'The session board on an easel: sticky notes under Big Room, Fireplace Room, Garden Room and Bar Room',
  '2007/flickr-581051037': 'The three-person panel on stage under the beCamp banner',
  '2007/flickr-581051195': 'The panel on stage, one panelist waving a sheet of paper',
  '2007/flickr-581051263': 'A smiling attendee in profile in the dark hall',
  '2007/flickr-581051485': 'A grinning attendee in a pink cardigan and name tag',
  '2007/flickr-581051561': 'Close-up of the session board: Ruby on Rails, JRuby, Grails, CSS Ninja and more',

  /* 2008: an open office space with pillars, folding chairs and a sticky-note wall. */
  '2008/becamp-2008-01': 'Attendees in rows of folding chairs, laughing during the opening',
  '2008/becamp-2008-02': 'An attendee in a cap speaking to the room, others in folding chairs listening',
  '2008/becamp-2008-03': 'Attendees in folding chairs laughing, others standing at the back with red cups',
  '2008/becamp-2008-04': 'An attendee with a red cup addressing the room beside a whiteboard',
  '2008/becamp-2008-05': 'A crowd at the sticky-note wall reading the proposed sessions',
  '2008/becamp-2008-06': 'An attendee pulling a face at the camera in front of the sticky-note wall',
  '2008/becamp-2008-07': 'Attendees studying sticky notes on the wall',
  '2008/becamp-2008-08': 'An attendee holding up an open laptop',
  '2008/becamp-2008-09': 'A presenter at the front of a room of folding chairs, an attendee in plaid shorts standing at the back',
  '2008/becamp-2008-10': 'A presenter speaking to a seated audience, seen past a standing attendee',
  '2008/becamp-2008-11': "A session from the back of the room, attendees in 'I rocked beCamp' shirts facing a projected slide",
  '2008/becamp-2008-12': 'The same session in brighter light, attendees in a loose ring of chairs',
  '2008/becamp-2008-13': 'Attendees with laptops around a table, listening to a speaker',
  '2008/becamp-2008-14': 'A presenter in a red shirt beside a projected slide, attendees with laptops at a table',
  '2008/becamp-2008-15': 'Attendees with laptops in folding chairs during a session',
  '2008/becamp-2008-16': "A presenter standing beside a projected slide titled 'Storage Engine Overview'",
  '2008/becamp-2008-17': 'An attendee in a red Yzerman jersey watching a speaker in the middle of a circle of chairs',
  '2008/becamp-2008-18': 'A speaker in red talking to a circle of attendees, seen over a shoulder',
  '2008/becamp-2008-19': 'Sticky notes running down a white wall',
  '2008/becamp-2008-20': 'A speaker in a red shirt standing in the middle of a large circle of attendees',
  '2008/becamp-2008-21': 'A wide view of the circle discussion, the speaker in red at the centre',
  '2008/becamp-2008-22': 'The speaker in red, cup in hand, addressing the circle of chairs',
  '2008/becamp-2008-23': 'A circle of attendees seen from a low angle, hands clasped in the foreground',
  '2008/becamp-2008-24': 'A wider low-angle view of the circle discussion',
  '2008/becamp-2008-25': 'Attendees in folding chairs listening, one in a blue cap',
  '2008/becamp-2008-26': 'Attendees leaning in during a discussion',
  '2008/becamp-2008-27': 'An attendee standing behind the seated circle during a session',
  '2008/becamp-2008-28': 'Attendees in the circle, one in a yellow and green shirt',
  '2008/becamp-2008-29': 'An attendee with a laptop balanced on their knees in a crowded session',
  '2008/becamp-2008-30': 'Attendees standing at the back of a session, one in a beCamp T-shirt',
  '2008/becamp-2008-31': 'Attendees laughing in the circle, one in a yellow and green Senegal shirt',
  '2008/becamp-2008-32': 'A large circle of chairs in the office space, an attendee in a number 14 shirt in the foreground',
  '2008/becamp-2008-33': 'Attendees seated and standing in a discussion, one in a Red Wings shirt',
  '2008/becamp-2008-34': 'An attendee in a Senegal shirt, seen from behind, facing the circle',
  '2008/becamp-2008-35': 'A row of attendees in folding chairs mid-conversation',
  '2008/becamp-2008-36': 'Attendees seated in a ring, photographed from knee height',
  '2008/flickr-2460894411': 'An attendee in a patterned shirt making their way through the crowd',
  '2008/flickr-2460894429': 'Attendees chatting with red cups in hand',
  '2008/flickr-2460894545': 'A crowd standing in a dim room, one tall attendee in a cap',
  '2008/flickr-2460894603': 'A projector screen glowing in a dark corner',
  '2008/flickr-2460894723': 'Attendees in a loose group of folding chairs, laptops open',
  '2008/flickr-2460894779': 'Attendees chatting near a table of drinks',
  '2008/flickr-2461559417': 'Attendees with laptops at a long table, a slide projected behind them',
  '2008/flickr-2461717558': 'Small groups talking between rows of folding chairs',
  '2008/flickr-2461726926': 'Close-up of rows of sticky notes on the session wall',
  '2008/flickr-2461727536': 'An attendee taking a photo while another stands by the whiteboard',
  '2008/flickr-2461727626': 'Three people at the whiteboard talking to a seated audience',
  '2008/flickr-2461727644': 'Attendees moving between sessions, the beCamp logo on the wall behind them',
  '2008/flickr-2461727658': 'A crowd of attendees standing between sessions',
  '2008/flickr-2461727768': 'A smiling attendee with a name tag, another in a beCamp shirt alongside',
  '2008/flickr-2461727880': 'A projected session schedule glowing in a dark room',
  '2008/flickr-2461766881': 'The Charlottesville beCamp logo on a glass wall',
  '2008/flickr-2461766889': 'A full session in folding chairs, an attendee in a red Yzerman jersey in front',
  '2008/flickr-2461766895': 'Attendees reading the sticky-note wall',
  '2008/flickr-2461766903': 'A session with attendees at laptops facing a projected slide',
  '2008/flickr-2461766917': 'Attendees in a circle of office chairs in discussion',
  '2008/flickr-2461776801': 'A presenter in a red shirt pointing at a projected web page',
  '2008/flickr-2461776891': 'The presenter in red walking through a projected web page',
  '2008/flickr-2461776991': 'A small session, attendees with laptops around a projected slide',
  '2008/flickr-2461777167': 'Attendees seated and standing near the sticky-note wall',
  '2008/flickr-2461777249': 'Lunch: chafing dishes, coolers and red cups on a counter',
  '2008/flickr-2461777401': 'A session around a table, a slide projected beside a potted palm',
  '2008/flickr-2461777531': 'A presenter pointing at a projected web page in a small room',
  '2008/flickr-2461777623': 'Attendees with laptops around a conference table',
  '2008/flickr-2462013367': 'A session in front of the sticky-note wall and the beCamp logo',
  '2008/flickr-2462016441': 'Attendees in folding chairs and on the floor beneath the sticky-note wall',
  '2008/flickr-2462609116': 'Attendees in a ring of chairs in a corner session',
  '2008/flickr-2462609198': 'A presenter in red pointing at a projected slide, attendees with laptops',
  '2008/flickr-2462609490': 'Painted figurines and a sketchbook laid out on a table',
  '2008/flickr-2462609798': 'Five attendees laughing together by the sticky-note wall',
  '2008/flickr-2462843950': 'The Charlottesville Business Innovation Council sign on the wall',
  '2008/flickr-2462844424': 'A session from the back, attendees in folding chairs facing a projector',
  '2008/flickr-2462847588': 'The same session, a slide projected beside the beCamp logo',
  '2008/flickr-2462848838': 'A small session, attendees with laptops near a projected slide',
  '2008/flickr-2462850212': 'A full room of attendees in folding chairs under the sticky-note wall',
  '2008/flickr-2463333800': 'A long room of folding chairs, people gathered at the sticky-note wall at the far end',
  '2008/flickr-2469224457': 'Three attendees laughing by a laptop and projector, red cups in hand',
  '2008/flickr-2469227295': 'Rows of sticky notes on the session wall',
  '2008/flickr-2469232117': 'Attendees adding sticky notes to the wall',
  '2008/flickr-2469232765': "A hand-drawn sticky note styled as a Virginia licence plate reading 'Intertubes'",
  '2008/flickr-2469234389': 'Sticky notes labelled with room names down the session wall',
  '2008/flickr-2469235917': 'An attendee pointing at a laptop screen while others look on',
  '2008/flickr-2470048986': 'Attendees chatting in front of a projector screen',
  '2008/flickr-2470050646': 'An attendee adding a mark to a sticky note on the wall',
  '2008/flickr-2470051518': 'Close-up of session sticky notes: Web 3.0, fast search engine design, Yahoo JavaScript API',
  '2008/flickr-2470052968': "A 'Hacking Matter: low-cost rapid prototyping' sticky note with a tiny figurine taped to it",
  '2008/flickr-2470053580': "Sticky notes for cloud computing and 'Raising kids and kicking ass at your job', covered in tally marks",
  '2008/flickr-2470053764': "A sticky note asking 'Panel? Solo?' below one covered in tally marks",
  '2008/flickr-2470055732': 'A grid of sticky-note session proposals, each with vote tallies',
  '2008/flickr-2470055932': 'A wider view of the sticky-note proposals on the wall',
  '2008/flickr-2470057360': 'Columns of sticky notes on the session wall',
  '2008/flickr-2470058868': 'Three attendees smiling arm in arm with red cups',
  '2008/flickr-2482693253': 'Attendees playing a video game with motion controllers, some sitting on the floor',
  '2008/flickr-2482693391': 'Attendees holding game controllers in front of a projected screen',
  '2008/flickr-2482693623': 'Three attendees laughing in folding chairs, laptops on their laps',
  '2008/flickr-2482693927': 'Attendees relaxing in folding chairs, laptops and bags around them',
  '2008/flickr-2482694003': 'An attendee with a lanyard and red cup in front of the sticky-note wall',
  '2008/flickr-2482694191': 'Two attendees posting sticky notes on the wall under the beCamp logo',
  '2008/flickr-2482694413': 'A wide view of a session in the office space, sticky notes on the far wall',
  '2008/flickr-2483507728': 'A crowd reading the sticky-note wall',
  '2008/flickr-2483507832': 'An attendee with a lanyard smiling near people at the sticky-note wall',
  '2008/flickr-2483508446': 'An attendee stretching to post a sticky note high on the wall',
  '2008/flickr-2483508890': 'A crowd standing in front of the sticky-note wall',
  '2008/flickr-2483509100': 'Attendees lined up along the sticky-note wall',

  /* 2009: a wood-panelled room with a blue-tape schedule grid. */
  '2009/flickr-3530772377': 'An attendee in a cap seated while another leans over, a blue-tape schedule grid on the wall',
  '2009/flickr-3530774071': 'Attendees talking and laughing near the blue-tape schedule grid',
  '2009/flickr-3530775299': 'Two attendees bent over a laptop together',
  '2009/flickr-3530775855': 'A presenter in front of a projected slide, attendees seated nearby',
  '2009/flickr-3531587030': 'An attendee laughing by sticky notes on the blue-tape schedule grid',

  /* 2011: a lecture room and open lobby, an index-card schedule in yellow tape. */
  '2011/flickr-6154001943': 'Attendees in rows of chairs watching a session at the front of a lecture room',
  '2011/flickr-6154002133': 'Attendees gathering at the front of the lecture room',
  '2011/flickr-6154002553': 'Attendees reading index cards on the schedule wall',
  '2011/flickr-6154002661': 'The schedule wall: index cards in a grid of yellow tape',
  '2011/flickr-6154003095': 'Index cards in the morning slots of the schedule wall',
  '2011/flickr-6154545872': 'Index cards under room names, Big Room and Board Room, on the schedule wall',
  '2011/flickr-6154546204': 'Index cards in the afternoon slots of the schedule wall',
  '2011/flickr-6154546442': 'The last time slot on the schedule wall, 15:30–16:20',
  '2011/flickr-6157436039': "A presenter at a lectern beside a slide titled 'Goals for this talk'",
  '2011/flickr-6157436687': 'Attendees in scattered chairs by tall windows between sessions',
  '2011/flickr-6157436825': 'Attendees talking at a table in the café area',
  '2011/flickr-6157436971': 'The open lobby, attendees working at laptops and chatting',
  '2011/flickr-6157978888': "A presenter at a lectern beside a slide reading 'An Introduction to Chef'",
  '2011/flickr-6157979048': 'A terminal session projected on the screen during a talk',
  '2011/flickr-6157979378': 'A presenter beside a screen of projected code',
  '2011/flickr-6157979552': 'Close-up of projected Python code during a session',
  '2011/flickr-6157979674': "A presenter pointing at a slide titled 'Visualizing git: amending commits'",

  '2014/2014_dep4b_pizza-dough': 'A ball of pizza dough in a glass bowl beside a bag of flour',
  '2014/2014_fromdavelewis_remote-presentation': 'A remote speaker on a video call projected on the screen, a host standing beside it',
  '2014/2014_softwaredoug_packet-sniffing': 'A presenter at a lectern during a session on packet sniffing',

  '2015/2015_tjmiano_cto-discussion': 'A small discussion in a lounge, attendees on a leather sofa and armchairs',
  '2015/2015_tjmiano_cto-share-session': 'Attendees listening in the lounge, one standing in a red jacket',
  '2015/2015_tjmiano_data-science': 'A data science discussion in the lounge, attendees in a circle of armchairs',

  '2016/2016_jxxf_bread': 'Homemade loaves of bread on a cloth, with a handwritten card',
  '2016/2016_metasim_between-sessions': 'An attendee trying a VR headset in the brick loft between sessions',
  '2016/2016_softwaredoug_pitch-time': 'Attendees standing around the brick loft during Pitch Night',
  '2016/2016_softwaredoug_proposed-talks': 'An attendee pitching with a microphone in front of a window covered in sticky-note proposals',
  '2016/2016_softwaredoug_schedule-1': 'The session grid in green tape on a dark wall, filled with sticky notes',
  '2016/2016_softwaredoug_schedule-2': 'Another section of the green-tape session grid, sticky notes marked with tallies',

  '2017/2017_CCR_inc_gta-ml-talk': 'A speaker presenting in the timber-roofed loft, a projected aerial image behind',
  '2017/2017_jxxf_welcome-1': 'A crowd gathered in the timber-roofed loft for the welcome',
  '2017/2017_jxxf_welcome-2': "A small robotic lawn mower on the loft's wooden floor",
  '2017/2017_kswilkens_cville-tech-women-1': 'Charlottesville Women in Tech members in purple shirts posing together',
  '2017/2017_kswilkens_cville-tech-women-2': 'A speaker in a purple Women in Tech shirt addressing seated attendees',
  '2017/2017_kswilkens_cville-tech-women-3': 'Attendees standing in the loft, some in purple Women in Tech shirts',
  '2017/2017_kswilkens_pitch-practice-shirt': 'An attendee pointing to the Charlottesville Women in Tech logo on a purple T-shirt',
  '2017/2017_kswilkens_purple-shirts': 'Charlottesville Women in Tech members in matching purple shirts',
};

export interface GalleryPhoto {
  /* "<year>/<filename>", stable across builds; doubles as the DOM id. */
  key: string;
  src: ImageMetadata;
  alt: string;
  credit: string;
}

export interface GalleryYear {
  year: number;
  photos: GalleryPhoto[];
}

/* YEAR_handle_slug → handle. The slug never contains an underscore; the
   handle may (CCR_inc), so the handle is everything between the first and
   last underscore. */
const creditFor = (name: string): string => {
  const handle = name.match(/^\d{4}_(.+)_[^_]+$/)?.[1];
  if (handle) return handle;
  if (name.startsWith('flickr-')) return 'beCamp community / Flickr';
  return 'beCamp community';
};

const photos: GalleryPhoto[] = Object.entries(files).map(([path, module]) => {
  const key = path.replace(/^.*\/gallery\//, '').replace(/\.jpg$/, '');
  const alt = ALT[key];
  if (!alt) throw new Error(`gallery: ${key} has no alt text in src/lib/gallery.ts`);
  return { key, src: module.default, alt, credit: creditFor(key.split('/')[1]) };
});

const orphaned = Object.keys(ALT).filter((key) => !photos.some((photo) => photo.key === key));
if (orphaned.length > 0) {
  throw new Error(`gallery: alt text with no matching file: ${orphaned.join(', ')}`);
}

/* Within a year, filename order is shooting order: the camera numbered its
   own frames, and Flickr IDs rise with upload. */
export const GALLERY: GalleryYear[] = [...new Set(photos.map((photo) => Number(photo.key.slice(0, 4))))]
  .sort((a, b) => b - a)
  .map((year) => ({
    year,
    photos: photos
      .filter((photo) => photo.key.startsWith(`${year}/`))
      .sort((a, b) => a.key.localeCompare(b.key, 'en', { numeric: true })),
  }));

export const totalPhotos = photos.length;
export const galleryYears = new Set(GALLERY.map((entry) => entry.year));
