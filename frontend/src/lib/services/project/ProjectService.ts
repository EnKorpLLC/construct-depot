import ApiService from '../ApiService';

export interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

class ProjectService {
  private static instance: ProjectService;
  private apiService: typeof ApiService;

  private constructor() {
    this.apiService = ApiService;
  }

  public static getInstance(): ProjectService {
    if (!ProjectService.instance) {
      ProjectService.instance = new ProjectService();
    }
    return ProjectService.instance;
  }

  public async getProjects(): Promise<Project[]> {
    return this.apiService.get<Project[]>('/api/projects');
  }

  public async getProject(id: string): Promise<Project> {
    return this.apiService.get<Project>(`/api/projects/${id}`);
  }

  public async createProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    return this.apiService.post<Project>('/api/projects', project);
  }

  public async updateProject(id: string, project: Partial<Project>): Promise<Project> {
    return this.apiService.put<Project>(`/api/projects/${id}`, project);
  }

  public async deleteProject(id: string): Promise<void> {
    return this.apiService.delete<void>(`/api/projects/${id}`);
  }
}

export default ProjectService.getInstance(); 