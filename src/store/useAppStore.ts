import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface CVMakerState {
    targetProgram: string;
    targetUniversity: string;
    uploadedFileName: string;
    tailoredSummary: string;
    tailoredExperience: any[];
    tailoredSkills: string[];
    setTargetProgram: (val: string) => void;
    setTargetUniversity: (val: string) => void;
    setUploadedFileName: (val: string) => void;
    setTailoredSummary: (val: string) => void;
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

interface AppState extends CVMakerState, DiscoverState {}

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            // CV Maker Slice
            targetProgram: '',
            targetUniversity: '',
            uploadedFileName: '',
            tailoredSummary: '',
            tailoredExperience: [],
            tailoredSkills: [],
            setTargetProgram: (targetProgram) => set({ targetProgram }),
            setTargetUniversity: (targetUniversity) => set({ targetUniversity }),
            setUploadedFileName: (uploadedFileName) => set({ uploadedFileName }),
            setTailoredSummary: (tailoredSummary) => set({ tailoredSummary }),
            setTailoredExperience: (tailoredExperience) => set({ tailoredExperience }),
            setTailoredSkills: (tailoredSkills) => set({ tailoredSkills }),
            resetCVMaker: () => set({
                targetProgram: '',
                targetUniversity: '',
                uploadedFileName: '',
                tailoredSummary: '',
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
        }),
        {
            name: 'accepta-app-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
