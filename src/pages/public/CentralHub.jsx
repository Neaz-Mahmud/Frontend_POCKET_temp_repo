import { Link } from 'react-router-dom';
import { BookMarked, Briefcase, ArrowRight, Store, Users } from 'lucide-react';
import { useCentralBase } from '../../utils/centralBase';
import './Public.css';

/**
 * The Central Segment landing — one place that fans out to the community
 * services that live outside any single section: the book marketplace and
 * the job-recruitment guides. Renders inside the viewer's own layout.
 */
const CentralHub = () => {
  const base = useCentralBase();
  return (
  <div>
    <div className="page-header central-hero">
      <p className="page-eyebrow">Central Segment</p>
      <h2>One campus, shared resources.</h2>
      <p className="text-secondary">
        Services for every student on the platform — buy and sell books, and learn exactly
        how organizations hire.
      </p>
    </div>

    <div className="central-grid">
      <Link to={`${base}/books`} className="card central-card">
        <div className="central-card-icon books"><BookMarked size={26} /></div>
        <h3>Book Sharing</h3>
        <p>
          Buy used books from students near you — filter by division, zila, university and
          price — or order brand-new books with free delivery.
        </p>
        <div className="central-card-points">
          <span><Users size={13} /> Student-to-student marketplace</span>
          <span><Store size={13} /> New-book store, ৳0 delivery</span>
        </div>
        <span className="central-card-cta">Browse books <ArrowRight size={15} /></span>
      </Link>

      <Link to={`${base}/jobs`} className="card central-card">
        <div className="central-card-icon jobs"><Briefcase size={26} /></div>
        <h3>Job Query</h3>
        <p>
          Step-by-step recruitment guides for government and private organizations — how they
          hire, what to prepare, with videos and downloadable documents.
        </p>
        <div className="central-card-points">
          <span><Briefcase size={13} /> Government &amp; private processes</span>
          <span><ArrowRight size={13} /> Curated by the platform team</span>
        </div>
        <span className="central-card-cta">Explore guides <ArrowRight size={15} /></span>
      </Link>
    </div>
  </div>
  );
};

export default CentralHub;
