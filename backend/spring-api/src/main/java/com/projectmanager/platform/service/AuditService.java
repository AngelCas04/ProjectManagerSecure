package com.projectmanager.platform.service;

import com.projectmanager.platform.domain.AuditEvent;
import com.projectmanager.platform.domain.Project;
import com.projectmanager.platform.repository.AuditEventRepository;
import org.springframework.stereotype.Service;

@Service
public class AuditService {

    private final AuditEventRepository auditEventRepository;

    public AuditService(AuditEventRepository auditEventRepository) {
        this.auditEventRepository = auditEventRepository;
    }

    public AuditEvent record(Project project, String scope, String actor, String description) {
        AuditEvent event = new AuditEvent();
        event.setProject(project);
        event.setScope(scope);
        event.setActor(actor);
        event.setDescription(description);
        return auditEventRepository.save(event);
    }
}
