import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface CVMakerState {
    targetProgram: string;
    targetUniversity: string;
    uploadedFileName: string;
    resumeData: any;
    tailoredSummary: string;
    educationList: any[];
    tailoredExperience: any[];
    tailoredSkills: string[];
    setTargetProgram: (val: string) => void;
    setTargetUniversity: (val: string) => void;
    setUploadedFileName: (val: string) => void;
    setResumeData: (data: any) => void;
    setTailoredSummary: (val: string) => void;
    setEducationList: (list: any[]) => void;
    setTailoredExperience: (list: any[]) => void;
    setTailoredSkills: (skills: string[]) => void;
    resetCVMaker: () => void;
}

interface DiscoverState {
    url: string;
    programData: any;
    searchHistory: any[];
    fitData: any;
    setUrl: (val: string) => void;
    setProgramData: (data: any) => void;
    setSearchHistory: (history: any[]) => void;
    setFitData: (data: any) => void;
    resetDiscover: () => void;
}

interface OnboardingState {
    step1Draft: any;
    step2Draft: any;
    step3Draft: any;
    vaultDocuments: any[];
    setStep1Draft: (draft: any) => void;
    setStep2Draft: (draft: any) => void;
    setStep3Draft: (draft: any) => void;
    setVaultDocuments: (docs: any[]) => void;
    resetOnboarding: () => void;
}

interface AppState extends CVMakerState, DiscoverState, OnboardingState {}

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            // CV Maker Slice
            targetProgram: '',
            targetUniversity: '',
            uploadedFileName: '',
            resumeData: null,
            tailoredSummary: '',
            educationList: [],
            tailoredExperience: [],
            tailoredSkills: [],
            setTargetProgram: (targetProgram) => set({ targetProgram }),
            setTargetUniversity: (targetUniversity) => set({ targetUniversity }),
            setUploadedFileName: (uploadedFileName) => set({ uploadedFileName }),
            setResumeData: (resumeData) => set({ resumeData }),
            setTailoredSummary: (tailoredSummary) => set({ tailoredSummary }),
            setEducationList: (educationList) => set({ educationList }),
            setTailoredExperience: (tailoredExperience) => set({ tailoredExperience }),
            setTailoredSkills: (tailoredSkills) => set({ tailoredSkills }),
            resetCVMaker: () => set({
                targetProgram: '',
                targetUniversity: '',
                uploadedFileName: '',
                resumeData: null,
                tailoredSummary: '',
                educationList: [],
                tailoredExperience: [],
                tailoredSkills: [],
            }),

            // Discover Slice
            url: '',
            programData: null,
            searchHistory: [],
            fitData: null,
            setUrl: (url) => set({ url }),
            setProgramData: (programData) => set({ programData }),
            setSearchHistory: (searchHistory) => set({ searchHistory }),
            setFitData: (fitData) => set({ fitData }),
            resetDiscover: () => set({
                url: '',
                programData: null,
                fitData: null,
            }),

            // Onboarding Slice
            step1Draft: null,
            step2Draft: null,
            step3Draft: null,
            vaultDocuments: [],
            setStep1Draft: (step1Draft) => set({ step1Draft }),
            setStep2Draft: (step2Draft) => set({ step2Draft }),
            setStep3Draft: (step3Draft) => set({ step3Draft }),
            setVaultDocuments: (vaultDocuments) => set({ vaultDocuments }),
            resetOnboarding: () => set({ 
                step1Draft: null, 
                step2Draft: null, 
                step3Draft: null,
                vaultDocuments: []
            }),
        }),
        {
            name: 'accepta-app-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
