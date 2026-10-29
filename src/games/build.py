import sys, os
d = os.path.dirname(os.path.abspath(__file__))
GAMES = {'star-rampart': ('StarRampart.html', 'Star Rampart'), 'brick-blitz': ('BrickBlitz.html', 'Brick Blitz'),
         'neon-hockey': ('NeonPongHockey.html', 'Neon Pong Hockey'), 'skyline-skater': ('SkylineSkater.html', 'Skyline Skater'),
         'turbo-tanks': ('TurboTanks.html', 'Turbo Tanks')}
out_dir = sys.argv[1]
head = open(os.path.join(d, 'head.html')).read(); kit = open(os.path.join(d, 'kit.js')).read()
for key in (sys.argv[2:] or GAMES):
    fn, title = GAMES[key]
    src = os.path.join(d, key + '.js')
    if not os.path.exists(src): continue
    body = kit + '\n' + open(src).read()
    assert '</script' not in body.lower()
    open(os.path.join(out_dir, fn), 'w').write(head.replace('__TITLE__', title) + body + '\n</script>\n</body>\n</html>\n')
    print('built', fn)
