'use client'

// import { Test, Video, VideoRotator, ImageContainer } from "components-react"
import { Test, ImageContainer, Gallery, ApiImage } from "components-react"
import { useState, ReactElement } from "react"

import images from "../../../../data/test/images/images.json"

type ComponentKey = 'Test' | 'ImageContainer' | 'Gallery' // | 'Video'// | 'VideoRotator' | 'ImageContainer';

const components: Record<ComponentKey, () => ReactElement> = {
    Test: () => <Test />,
    ImageContainer: () => <ImageContainer
        src="https://picsum.photos/200/300"
        alt="placeholder"
        blurDataURL="https://picsum.photos/12/18"        
    />,
    Gallery: () => <Gallery images={images as ApiImage[]}/>
    
    // VideoRotator: () => <VideoRotator />,
    // ImageContainer: () => <ImageContainer />
}

export const UIComponents = () => {
    
    const [currentComponent, setCurrentComponent] = useState<ComponentKey>('Test')

    const CurrentComponent = components[currentComponent];

    return (
        <div className="flex flex-col gap-4">
            <select
                className="w-80 p-1 text-sm"
                value={currentComponent}
                onChange={(e) => setCurrentComponent(e.target.value as ComponentKey)}
            >
                {(Object.keys(components) as ComponentKey[]).map((name) => (
                    <option key={name} value={name}>
                        {name}
                    </option>
                ))}
            </select>
            <div className="component-wrapper w-80 h-80">
                <CurrentComponent />
            </div>
        </div>
    )
}