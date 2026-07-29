import { useState } from 'react';
import SectionSelect from '../../components/SectionSelect';
import MaterialExplorer from '../../components/MaterialExplorer';
import '../../styles/Panels.css';

const ClassMaterial = () => {
  const [section, setSection] = useState(null);

  return (
    <div>
      <div className="page-header">
        <h2>Class Material</h2>
        <p className="text-secondary">Browse materials shared by your Sections — read-only</p>
      </div>

      <SectionSelect value={section} onChange={setSection} />

      {section && (
        <div className="mt-section">
          <MaterialExplorer sectionId={section._id} canManage={false} />
        </div>
      )}
    </div>
  );
};

export default ClassMaterial;
