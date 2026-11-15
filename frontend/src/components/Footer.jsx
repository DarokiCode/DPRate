export default function Footer({ genres, user }) {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-top">
          <div className="footer-brand">
            <img src="/assets/dprate-wordmark.png" alt="DPRate" width="208" height="52" />
            <p>Honest ratings from players, not critics. Find your next game, then tell everyone what you thought of it.</p>
          </div>
          <nav className="footer-links" aria-label="Footer">
            <div>
              <h2 className="footer-heading">Browse</h2>
              <a href="#browse">All games</a>
              <a href="#browse?sort=top">Top rated</a>
              <a href="#browse?sort=reviews">Most reviewed</a>
              <a href="#browse?sort=new">Newest releases</a>
            </div>
            <div>
              <h2 className="footer-heading">Genres</h2>
              {genres.map(genre => <a key={genre.id} href={`#browse?genre=${encodeURIComponent(genre.name)}`}>{genre.name}</a>)}
            </div>
            <div>
              <h2 className="footer-heading">Your DPRate</h2>
              {user ? (
                <><a href="#account">My account</a><a href="#favourites">My favourites</a></>
              ) : (
                <><a href="#login">Log in</a><a href="#register">Create an account</a></>
              )}
            </div>
          </nav>
        </div>
        <div className="footer-bottom">
          <p>DPRate is a student project for INT1059 Advanced Web at AIT, built by Team Guava (Davi Rocha and Pedro Meloni), 2026.</p>
          <p>Game artwork and logos belong to their publishers and are shown for review purposes. Game details come from Wikipedia and the publishers’ pages.</p>
        </div>
      </div>
    </footer>
  )
}
