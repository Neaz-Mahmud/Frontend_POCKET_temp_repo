import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../api/axios';
import { ArrowLeft, FileDown, Briefcase } from 'lucide-react';
import { youtubeEmbed } from '../../utils/youtube';
import ReactBlock from '../../components/ReactBlock';
import { useCentralBase } from '../../utils/centralBase';
import './Public.css';

const JobDetail = () => {
  const base = useCentralBase();
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/jobs/${id}`)
      .then(({ data }) => setPost(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="text-secondary">Loading…</p>;
  if (error || !post) return <div><Link to={`${base}/jobs`} className="btn btn-ghost btn-sm"><ArrowLeft size={15} /> Back</Link><p className="text-secondary" style={{ marginTop: 'var(--space-4)' }}>This post is unavailable.</p></div>;

  return (
    <div>
      <Link to={`${base}/jobs`} className="btn btn-ghost btn-sm" style={{ marginBottom: 'var(--space-4)' }}><ArrowLeft size={15} /> All job guides</Link>

      {post.coverUrl && (
        <div className="job-detail-hero"><img src={post.coverUrl} alt={post.organization} /></div>
      )}

      <div className="job-detail-head">
        <span className="job-cat">{post.category}</span>
        <h1>{post.organization}</h1>
        {post.position && <div className="job-position" style={{ fontSize: 'var(--text-lg)' }}>{post.position}</div>}
        {post.summary && <p className="text-secondary" style={{ marginTop: 'var(--space-2)' }}>{post.summary}</p>}
      </div>

      <div className="job-blocks">
        {post.blocks?.length === 0 && <p className="text-secondary">No details have been added yet.</p>}
        {post.blocks?.map((b, i) => {
          if (b.type === 'text') return <p key={i} className="job-block-text">{b.text}</p>;
          if (b.type === 'image' && b.imageUrl) return <div key={i} className="job-block-image"><img src={b.imageUrl} alt="" /></div>;
          if (b.type === 'youtube') {
            const embed = youtubeEmbed(b.youtubeUrl);
            return embed ? (
              <div key={i} className="job-block-video">
                <iframe src={embed} title={`video-${i}`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
              </div>
            ) : null;
          }
          if (b.type === 'file' && b.fileUrl) return (
            <div key={i} className="job-block-file">
              <a href={b.fileUrl} target="_blank" rel="noreferrer" download={b.fileName || true}>
                <FileDown size={17} /> {b.fileName || 'Download attachment'}
              </a>
            </div>
          );
          if (b.type === 'react' && b.code) return (
            <div key={i} className="job-block-react">
              <ReactBlock code={b.code} />
            </div>
          );
          return null;
        })}
      </div>

      {!post.coverUrl && (!post.blocks || post.blocks.length === 0) && (
        <div className="admin-empty" style={{ textAlign: 'center' }}><Briefcase size={36} /></div>
      )}
    </div>
  );
};

export default JobDetail;
