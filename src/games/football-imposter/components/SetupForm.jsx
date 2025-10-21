import { useState, useEffect } from 'react';

function SetupForm({ settings, onStartRound, validateSettings }) {
  const [formData, setFormData] = useState({
    count: settings.count,
    names: settings.names.length > 0 ? [...settings.names] : Array(settings.count).fill(''),
    imposters: settings.imposters,
  });
  const [errors, setErrors] = useState({});

  // Update form when player count changes
  useEffect(() => {
    const count = parseInt(formData.count) || 0;
    // Only generate name inputs if count is valid (3-12)
    if (count >= 3 && count <= 12 && count !== formData.names.length) {
      const currentNames = [...formData.names];
      if (count > currentNames.length) {
        // Add empty slots
        while (currentNames.length < count) {
          currentNames.push('');
        }
      } else {
        // Remove excess slots
        currentNames.splice(count);
      }
      setFormData(prev => ({ ...prev, names: currentNames }));
    } else if (count < 3 || count > 12) {
      // Clear names if count is invalid
      setFormData(prev => ({ ...prev, names: [] }));
    }
  }, [formData.count, formData.names.length]);

  // Re-validate imposter count when player count changes
  useEffect(() => {
    const count = parseInt(formData.count);
    const imposters = parseInt(formData.imposters);
    
    if (count && imposters && imposters >= count) {
      setErrors(prev => ({ ...prev, imposters: 'Imposter count must be less than player count' }));
    } else if (formData.imposters && imposters >= 1 && imposters <= 3) {
      // Clear imposter error if it's now valid
      setErrors(prev => ({ ...prev, imposters: '' }));
    }
  }, [formData.count, formData.imposters]);

  const handleCountChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, count: value }));
    
    // Real-time validation for player count
    const count = parseInt(value);
    if (value && (!count || count < 3 || count > 12)) {
      setErrors(prev => ({ ...prev, count: 'Player count must be between 3 and 12' }));
    } else {
      setErrors(prev => ({ ...prev, count: '' }));
    }
  };

  const handleImposterChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, imposters: value }));
    
    // Real-time validation for imposter count
    const imposters = parseInt(value);
    const count = parseInt(formData.count);
    
    if (value && (!imposters || imposters < 1 || imposters > 3)) {
      setErrors(prev => ({ ...prev, imposters: 'Imposter count must be between 1 and 3' }));
    } else if (count && imposters && imposters >= count) {
      setErrors(prev => ({ ...prev, imposters: 'Imposter count must be less than player count' }));
    } else {
      setErrors(prev => ({ ...prev, imposters: '' }));
    }
  };

  const handleNameChange = (index, value) => {
    const newNames = [...formData.names];
    newNames[index] = value;
    setFormData(prev => ({ ...prev, names: newNames }));
    setErrors(prev => ({ ...prev, names: '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Trim names and convert strings to numbers
    const trimmedNames = formData.names.map(name => name.trim());
    const finalFormData = { 
      ...formData, 
      names: trimmedNames,
      count: parseInt(formData.count) || 0,
      imposters: parseInt(formData.imposters) || 0
    };
    
    // Validate
    const validation = validateSettings(finalFormData);
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }
    
    // Clear errors and start round
    setErrors({});
    onStartRound(finalFormData);
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Game Setup</h2>
        <p className="card-description">
          Configure your game settings and add player names
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="player-count" className="form-label">
              Number of Players (3-12)
            </label>
            <input
              id="player-count"
              type="number"
              min="3"
              max="12"
              value={formData.count}
              onChange={handleCountChange}
              className="form-input"
              required
            />
            <div className="form-error" style={{ visibility: errors.count ? 'visible' : 'hidden', minHeight: '1.25rem' }}>
              {errors.count || ' '}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="imposter-count" className="form-label">
              Number of Imposters (1-3)
            </label>
            <input
              id="imposter-count"
              type="number"
              min="1"
              max="3"
              value={formData.imposters}
              onChange={handleImposterChange}
              className="form-input"
              required
            />
            <div className="form-error" style={{ visibility: errors.imposters ? 'visible' : 'hidden', minHeight: '1.25rem' }}>
              {errors.imposters || ' '}
            </div>
          </div>
        </div>

        {formData.names.length > 0 && parseInt(formData.count) >= 3 && parseInt(formData.count) <= 12 && (
          <div className="form-group">
            <label className="form-label">Player Names</label>
            <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
              {formData.names.map((name, index) => (
                <input
                  key={index}
                  type="text"
                  placeholder={`Player ${index + 1}`}
                  value={name}
                  onChange={(e) => handleNameChange(index, e.target.value)}
                  className="form-input"
                  required
                  maxLength={20}
                />
              ))}
            </div>
            <div className="form-error" style={{ visibility: errors.names ? 'visible' : 'hidden', minHeight: '1.25rem' }}>
              {errors.names || ' '}
            </div>
          </div>
        )}

        <button type="submit" className="btn btn-primary btn-large btn-full">
          Start Round
        </button>
      </form>
    </div>
  );
}

export default SetupForm;
