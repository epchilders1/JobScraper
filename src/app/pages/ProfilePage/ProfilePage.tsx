"use client";
import './ProfilePage.css';
import { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import InputFiles from '~/app/_components/InputFiles/InputFiles';
import InputTags from '~/app/_components/InputTags/InputTags';
import InputSelect from '~/app/_components/InputSelect/InputSelect';
import InputNumber from '~/app/_components/InputNumber/InputNumber';

const WORK_STYLE_OPTIONS = [
  { label: 'Remote', value: 'remote' },
  { label: 'Hybrid', value: 'hybrid' },
  { label: 'On-site', value: 'onsite' },
  { label: 'No preference', value: 'any' },
];

const EXPERIENCE_OPTIONS = [
  { label: 'Entry level', value: 'entry' },
  { label: 'Mid level', value: 'mid' },
  { label: 'Senior', value: 'senior' },
  { label: 'Staff / Principal', value: 'staff' },
];

const JOB_TYPE_OPTIONS = [
  { label: 'Full-time', value: 'full-time' },
  { label: 'Part-time', value: 'part-time' },
  { label: 'Contract', value: 'contract' },
  { label: 'Internship', value: 'internship' },
];

interface ProfilePageProps {
  user?: any;
  handleUpsertUserPreferences?: (data: any) => Promise<void>;
}

export default function ProfilePage(props: ProfilePageProps) {
  const {user, handleUpsertUserPreferences} = props
  const prefs = user?.preferences ?? {};
  // console.log(user)
  useEffect(() => {
    void import('ldrs').then(({ ring }) => ring.register());
  }, []);

  const [loading, setLoading] = useState(false);
  const [resume, setResume] = useState<File | string | null>(user?.resume?.fileName ?? null);
  const [targetTitles, setTargetTitles] = useState<string[]>(prefs.targetTitles ?? []);
  const [workStyle, setWorkStyle] = useState<string | null>(prefs.workStyle ?? null);
  const [experienceLevel, setExperienceLevel] = useState<string[]>(prefs.experienceLevel ?? []);
  const [jobTypes, setJobTypes] = useState<string[]>(prefs.jobTypes ?? []);
  const [minSalary, setMinSalary] = useState<number | null>(prefs.minSalary ?? null);
  const [minMatchScore, setMinMatchScore] = useState<number | null>(
    prefs.minMatchScore ?? null
  );
  const [preferredCities, setPreferredCities] = useState<string[]>(prefs.preferredCities ?? []);
  const [requiredKeywords, setRequiredKeywords] = useState<string[]>(prefs.requiredKeywords ?? []);
  const [excludedKeywords, setExcludedKeywords] = useState<string[]>(prefs.excludedKeywords ?? []);

  const handleResumeChange = (value: File | string | null) => {
    setResume(value);
    if (value === null) toast.success('Resume removed.');
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    setLoading(true);
    e.preventDefault();
    try{
      await handleUpsertUserPreferences?.({
        workStyle,
        targetTitles,
        resume,
        experienceLevel,
        jobTypes,
        minSalary,
        minMatchScore,
        preferredCities,
        requiredKeywords,
        excludedKeywords,
      });
    toast.success('Preferences saved.');
    }
    catch(err) {
      toast.error('Failed to save preferences.');
    }
    setLoading(false);
  };

  return (
    <div className="pp">
      <Toaster position="top-right" toastOptions={{ style: { background: '#1A1A24', color: '#F0F0FF', border: '1px solid #2A2A3A' } }} />

      <form className="pp-main" onSubmit={handleSubmit}>

        <div className="pp-content">

          <div className="pp-section">
            <h2 className="pp-section__title">{"What I'm looking for"}</h2>
            <div className="pp-field">
              <InputTags
                label="Target titles"
                value={targetTitles}
                onChange={setTargetTitles}
                placeholder="e.g. Software Engineer, ML Engineer…"
                required
              />
            </div>
            <div className="pp-grid-2">
              <InputSelect
                label="Work style"
                options={WORK_STYLE_OPTIONS}
                value={workStyle}
                onChange={setWorkStyle}
                placeholder="Pick one"
              />
              <InputSelect
                label="Experience level"
                multiple
                options={EXPERIENCE_OPTIONS}
                value={experienceLevel}
                onChange={setExperienceLevel}
                placeholder="Pick all that apply"
              />
            </div>
            <div className="pp-field">
              <InputSelect
                label="Job types"
                multiple
                options={JOB_TYPE_OPTIONS}
                value={jobTypes}
                onChange={setJobTypes}
                placeholder="Pick all that apply"
              />
            </div>
            <div className="pp-field">
                <InputFiles
                value={resume}
                onChange={handleResumeChange}
                accept=".pdf"
                />
            </div>
          </div>

          <div className="pp-section">
            <h2 className="pp-section__title">Filters</h2>
            <div className="pp-grid-2">
              <InputNumber
                label="Minimum salary"
                value={minSalary}
                onChange={setMinSalary}
                prefix="$"
                placeholder="80000"
                min={0}
              />
              <InputNumber
                label="Min match score"
                value={minMatchScore}
                onChange={setMinMatchScore}
                suffix="%"
                placeholder="70"
                min={0}
                max={100}
              />
            </div>
            <div className="pp-field">
              <InputTags
                label="Preferred cities"
                value={preferredCities}
                onChange={setPreferredCities}
                placeholder="e.g. San Francisco, New York…"
              />
            </div>
          </div>

          <div className="pp-section">
            <h2 className="pp-section__title">Keywords</h2>
            <div className="pp-grid-2">
              <InputTags
                label="Must include"
                value={requiredKeywords}
                onChange={setRequiredKeywords}
                placeholder="e.g. TypeScript, Rust…"
              />
              <InputTags
                label="Exclude if contains"
                value={excludedKeywords}
                onChange={setExcludedKeywords}
                placeholder="e.g. 10+ years, clearance…"
              />
            </div>
          </div>

          <div className="pp-footer">
            <button type="submit" className="pp-submit">
                {!loading && (
                <p> Save preferences</p>
                )}
                {loading && (
                <l-ring
                    size="30"
                    stroke="5"
                    bg-opacity="0"
                    speed="2" 
                    color="white" 
                />
                )}
            </button>
          </div>

        </div>
      </form>
    </div>
  );
}
