import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import OldBooksMarket from './OldBooksMarket';
import NewBooksStore from './NewBooksStore';
import SellBooks from './SellBooks';
import './Public.css';

const BooksBrowse = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState('old');
  const [meta, setMeta] = useState({ divisions: {}, universities: [] });

  useEffect(() => {
    Promise.all([api.get('/meta/geo'), api.get('/meta/universities')])
      .then(([geo, uni]) => setMeta({ divisions: geo.data.divisions, universities: uni.data.universities }))
      .catch(() => {});
  }, []);

  return (
    <div>
      <div className="page-header">
        <p className="page-eyebrow">Central Segment</p>
        <h2>Book Sharing</h2>
        <p className="text-secondary">Buy used books from students, or order brand-new books with free delivery.</p>
      </div>

      <div className="subtab-row">
        <button className={`subtab${tab === 'old' ? ' active' : ''}`} onClick={() => setTab('old')}>Used Books</button>
        <button className={`subtab${tab === 'new' ? ' active' : ''}`} onClick={() => setTab('new')}>New Books Store</button>
        {user && <button className={`subtab${tab === 'sell' ? ' active' : ''}`} onClick={() => setTab('sell')}>Sell / My Listings</button>}
      </div>

      {tab === 'old' && <OldBooksMarket meta={meta} />}
      {tab === 'new' && <NewBooksStore />}
      {tab === 'sell' && user && <SellBooks meta={meta} onPosted={() => setTab('old')} />}
    </div>
  );
};

export default BooksBrowse;
